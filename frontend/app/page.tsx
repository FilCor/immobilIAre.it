import { ChatInterface } from "@/components/chat-interface";

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 selection:bg-emerald-100 selection:text-emerald-900">
      <ChatInterface />
    </main>
  );
}
