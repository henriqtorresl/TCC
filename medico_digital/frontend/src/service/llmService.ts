import axios from "axios";
import { toast } from "sonner";

const BASE_URL = "http://localhost:3000";

export const sendMessage = async (text: string) => {
  let data;
  try {
    const api = `${BASE_URL}/api/message`;

    const response = await axios.post(api, {
      userId: "1",
      text,
    });

    if (response) {
      data = response.data;
    }
  } catch (err) {
    toast.error("Erro ao enviar mensagem.", {
      position: "top-center",
    });
  } finally {
    return data;
  }
};
