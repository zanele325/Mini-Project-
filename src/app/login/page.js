import { Suspense } from "react";
import LoginContent from "./LoginContent";



export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
