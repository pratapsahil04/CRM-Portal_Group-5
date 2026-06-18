<?php
// backend/ticket/message.php
require_once __DIR__ . '/../config/db.php';

$user = authenticate();
$input = getJSONInput();

$convId = isset($input['conversation_id']) ? (int)$input['conversation_id'] : 0;
$messageText = isset($input['message']) ? trim($input['message']) : '';
$fileUrl = isset($input['file_url']) ? trim($input['file_url']) : '';

if (!$convId || empty($messageText)) {
    sendResponse(['error' => 'Conversation ID and message body are required'], 400);
}

$db = getDBConnection();

try {
    // 1. Verify access to conversation
    $cStmt = $db->prepare("
        SELECT c.*, t.technician_id, t.customer_id AS ticket_customer_id 
        FROM CONVERSATION c
        INNER JOIN TICKET t ON c.ticket_id = t.ticket_id
        WHERE c.conversation_id = ?
    ");
    $cStmt->execute([$convId]);
    $conv = $cStmt->fetch();

    if (!$conv) {
        sendResponse(['error' => 'Conversation not found'], 404);
    }

    if ($user['role'] === 'customer' && (int)$conv['customer_id'] !== $user['customer_id']) {
        sendResponse(['error' => 'You do not have access to this conversation'], 403);
    }
    if ($user['role'] === 'technician' && (int)$conv['technician_id'] !== $user['technician_id']) {
        sendResponse(['error' => 'You are not assigned to this ticket conversation'], 403);
    }

    $db->beginTransaction();

    // 2. Insert Message
    $mStmt = $db->prepare("
        INSERT INTO MESSAGE (conversation_id, sender_id, message, created_at)
        VALUES (?, ?, ?, NOW())
    ");
    $mStmt->execute([$convId, $user['user_id'], $messageText]);
    $messageId = $db->lastInsertId();

    $attachments = [];
    // 3. Insert Attachment if file_url provided
    if (!empty($fileUrl)) {
        if (!preg_match('/^https?:\/\/.+/', $fileUrl)) {
            sendResponse(['error' => 'Attachment URL must be an absolute http or https link'], 400);
        }
        $aStmt = $db->prepare("
            INSERT INTO ATTACHMENT (message_id, file_url)
            VALUES (?, ?)
        ");
        $aStmt->execute([$messageId, $fileUrl]);
        $attachmentId = $db->lastInsertId();
        $attachments[] = [
            'attachment_id' => (int)$attachmentId,
            'message_id' => (int)$messageId,
            'file_url' => $fileUrl
        ];
    }

    $db->commit();

    sendResponse([
        'message_id' => (int)$messageId,
        'conversation_id' => $convId,
        'sender_id' => (int)$user['user_id'],
        'sender_name' => $user['name'],
        'sender_role' => $user['role'],
        'message' => $messageText,
        'created_at' => date('Y-m-d H:i:s'),
        'attachments' => $attachments
    ], 201);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    sendResponse(['error' => 'Failed to send message: ' . $e->getMessage()], 500);
}
