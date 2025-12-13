import React from "react";
import LoginTemplate from "./LoginTemplate";

export default function AdminLogin() {
  return <LoginTemplate role="Admin" loginPath="/admin-dashboard" />;
}
