import React from "react";
import Logo from "./Logo";

export default function PageHeader({
  title,
  rightContent = null,
  centeredTitle = false,
}) {
  return (
    <header
      className="pt-[max(18px,env(safe-area-inset-top))]"
      style={{ fontFamily: "Helvetica"}}
    >
      <div className="flex items-center justify-between">
        <Logo />
        {rightContent || <div className="h-14 w-14" />}
      </div>

      {title && (
        <h1
          style={{ fontFamily: '"Helvetica Heavy", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className={`mt-2 font-black tracking-normal ${
            centeredTitle
              ? "text-center text-[26px] md:text-[20px]"
              : "text-[30px]"
          }`}
        >
          {title}
        </h1>
      )}
    </header>
  );
}
