import { Suspense } from "react";
import MessagesPage from "@/components/chat/MessagesPage";
import { PageSpinner } from "@/components/shared/spinner";

function MessagesFallback() {
  return <PageSpinner containerClassName="h-full min-h-[calc(100vh-8rem)]" />;
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
