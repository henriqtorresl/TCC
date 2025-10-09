import { SendHorizontal } from "lucide-react";
import { Button } from "./components/ui/button";

function App() {
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
      <div className="h-[80%]"></div>

      {/* Input de envio */}
      <div className="h-[10%] p-5">
        <div className="w-full rounded-lg bg-gray-700 py-2 px-4 flex flex-row justify-between items-center">
          <input
            placeholder="Enter message..."
            type="text"
            className="text-white appearance-none border-none bg-transparent outline-none shadow-none flex-1"
          />
          <Button className="cursor-pointer bg-gray-800" size="icon-lg">
            <SendHorizontal />
          </Button>
        </div>
      </div>
    </main>
  );
}

export default App;
