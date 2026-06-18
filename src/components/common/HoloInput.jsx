import React from 'react';

export default function HoloInput({ label, id, children, ...props }) {
  return (
    <div className="input-container">
      <input 
        id={id}
        placeholder=" "
        className="holo-input"
        {...props}
      />
      {label && (
        <label htmlFor={id} className="input-label" data-text={label}>
          {label}
        </label>
      )}
      <div className="input-border"></div>
      <div className="input-glow"></div>
      <div className="input-scanline"></div>
      <div className="input-corners">
        <div className="corner corner-tl"></div>
        <div className="corner corner-tr"></div>
        <div className="corner corner-bl"></div>
        <div className="corner corner-br"></div>
      </div>
      <div className="input-data-stream">
        <div className="stream-bar" style={{ '--i': 1 }}></div>
        <div className="stream-bar" style={{ '--i': 2 }}></div>
        <div className="stream-bar" style={{ '--i': 3 }}></div>
        <div className="stream-bar" style={{ '--i': 4 }}></div>
        <div className="stream-bar" style={{ '--i': 5 }}></div>
      </div>
      {children}
    </div>
  );
}
