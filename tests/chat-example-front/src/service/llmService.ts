import axios from "axios";

const BASE_URL = "http://localhost:3000";

export const sendMessage = async (text: string) => {
  let data;
  const api = `${BASE_URL}/api/message`;

  const response = await axios.post(api, {
    userId: "1",
    text,
  });

  if (response) {
    data = response.data;
  }

  return data;
};
