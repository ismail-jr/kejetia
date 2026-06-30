import { Suspense } from "react";
import MessagesPage from "@/components/chat/MessagesPage";

function MessagesFallback() {
  return (
    <div className="h-full min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ProviderMessagesPage() {
  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-4rem)] flex flex-col">
      <Suspense fallback={<MessagesFallback />}>
        <MessagesPage />
      </Suspense>
    </div>
  );
}
