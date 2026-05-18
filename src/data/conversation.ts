export type ChatMessage = { role: "user" | "ai"; text: string };

export const conversation: ChatMessage[] = [
  { role: "user", text: "What is happening in Cage-1?" },
  {
    role: "ai",
    text:
      "Cage-1 is showing a high-risk pattern consistent with early-stage Pasteurellosis (cold-water vibriosis). Over the past 15 days, dissolved oxygen has fallen from 9.5 to 6.95 mg/L — a 27% decline — while daily mortality has climbed to 5.0%. At the current water temperature of 11.2°C, this matches the known conditions for Aliivibrio salmonicida proliferation.\n\nI recommend: (1) Contact your fish veterinarian today, (2) Reduce stocking density in Cage-1 by 30%, (3) Increase aeration immediately.\n\nWithout intervention, full outbreak spread is likely within 72 hours, putting 190,430 fish at risk. Estimated financial exposure: €2,400,000.",
  },
  { role: "user", text: "Are the other cages safe?" },
  {
    role: "ai",
    text:
      "Yes. Cages 2 through 6 are all within normal parameters. Dissolved oxygen is stable between 9.1 and 9.8 mg/L, daily mortality is below 0.04%, and pH readings are in the optimal range of 7.1 to 7.4. No action is required on those cages today. I will continue monitoring and alert you immediately if anything changes.",
  },
  { role: "user", text: "How much money are we saving by catching this early?" },
  {
    role: "ai",
    text:
      "By detecting this outbreak 15 days before visible symptoms, you have a critical intervention window. A full Pasteurellosis outbreak in a cage of 190,430 fish typically causes 40 to 85% mortality. At an average market value of €5.20 per kg and average fish weight of 4.1 kg, total stock value is approximately €4,060,000.\n\nEarly intervention typically reduces losses by 60%, meaning AquaSense has likely saved you €2,400,000 on this single event — compared to an annual subscription cost of €60,000. That is a 40x return on investment.",
  },
];
