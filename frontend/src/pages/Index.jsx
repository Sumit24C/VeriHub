import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";

export default function Index() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}