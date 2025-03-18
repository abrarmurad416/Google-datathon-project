import React from "react";

interface ButtonProps {
  className?: string;
}

export default function Button({ className }: ButtonProps) {
  return (
    <button className={className} onClick={() => alert("Hello")}>
      Start Practicing!
    </button>
  );
}
