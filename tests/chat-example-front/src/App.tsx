import { SendHorizontal } from "lucide-react";
import { Button } from "./components/ui/button";
import { sendMessage } from "./service/llmService";
import { useState } from "react";

type Messages = {
  role: "user" | "assistant";
  text: string;
};

function App() {
  const [textInput, setTextInput] = useState<string>("");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleMessage = async () => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: textInput }]);
    const response: any = await sendMessage(textInput);

    if (response) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: response.reply },
      ]);

      setTextInput("");
    }
    setIsLoading(false);
  };

  return (
    <main className="w-full h-full flex flex-col justify-between bg-black">
      {/* Header */}
      <div className="h-[10%] flex flex-row items-center gap-4 border-b-1 border-gray-700 p-5">
        <div className="relative h-[50px] w-[50px] rounded-full bg-gray-700 flex items-center justify-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
            alt="Avatar Médico"
            className="h-[40px] w-[40px] rounded-full object-cover"
          />
          <div className="absolute bottom-1 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-700" />
        </div>
        <h1 className="text-white text-lg font-bold">Médico Virtual</h1>
      </div>

      {/* Mensagens: */}
      <div className="h-[80%] flex flex-col gap-2 px-4 py-6 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg shadow-md text-sm font-medium
                ${
                  msg.role === "user"
                    ? "bg-gray-800 text-white border border-gray-700"
                    : "bg-gray-700 text-white border border-gray-600"
                }
              `}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] px-4 py-4 rounded-lg shadow-md text-sm font-medium bg-gray-700 text-white border border-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-white animate-bounce delay-300" />
            </div>
          </div>
        )}
      </div>

      {/* Input de envio */}
      <div className="h-[10%] p-5">
        <div className="w-full rounded-lg bg-gray-700 py-2 px-4 flex flex-row justify-between items-center">
          <input
            placeholder="Digite sua mensagem..."
            type="text"
            className="text-white appearance-none border-none bg-transparent outline-none shadow-none flex-1"
            onChange={(e) => {
              setTextInput(e.target.value);
            }}
            value={textInput}
          />
          <Button
            className="cursor-pointer bg-gray-800"
            size="icon-lg"
            onClick={handleMessage}
            disabled={isLoading}
          >
            <SendHorizontal />
          </Button>
        </div>
      </div>
    </main>
  );
}

export default App;
