import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import Verification from "./Verification";

export default function Index() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        {/* <ChatInterface /> */}
        <Verification/>
      </div>
    </div>
  );
}