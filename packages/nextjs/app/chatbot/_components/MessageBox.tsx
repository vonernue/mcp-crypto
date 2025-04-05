"use client";

import React from "react";
import { useState } from "react";
import { InputBase } from "~~/components/scaffold-eth";

/**
 * Generic Input component to handle input's based on their function param type
 */
const MessageBox = () => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl"></div>
    </div>
  );
};
export default MessageBox;
