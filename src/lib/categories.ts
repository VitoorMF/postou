export type Category = "novidade" | "conquista" | "evento" | "bastidor" | "dica" | "parceria" | "geral";

export const categoryColors: Record<Category, string> = {
  novidade:  "bg-blue-600 text-white",
  conquista: "bg-yellow-500 text-black",
  evento:    "bg-purple-600 text-white",
  bastidor:  "bg-orange-500 text-white",
  dica:      "bg-emerald-600 text-white",
  parceria:  "bg-pink-600 text-white",
  geral:     "bg-[#2b2b2b] text-[#888079]",
};
