import React, { useState } from "react";
import LoginComponent from "./components/LoginComponent";
import { FullAutomationApp } from "./FullAutomationApp";

export default function App() {
  const [authorized, setAuthorized] = useState(false);
  return authorized ? <FullAutomationApp /> : <LoginComponent onSuccess={() => setAuthorized(true)} />;
}
