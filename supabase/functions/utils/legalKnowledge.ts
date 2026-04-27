export type LegalKnowledgeItem = {
  topic: string;
  prompt: string;
  response: string;
  tags: string[];
};

export const LEGAL_KNOWLEDGE_DATASET: LegalKnowledgeItem[] = [
  {
    topic: "UPI Fraud",
    prompt: "money deducted from account because of upi scam",
    response:
      "For UPI or cyber fraud, immediately call 1930, file complaint at cybercrime.gov.in, and inform your bank to block risky channels.",
    tags: ["upi", "cyber", "fraud", "bank", "1930"],
  },
  {
    topic: "Fake Product Consumer Complaint",
    prompt: "seller delivered fake product and refused refund",
    response:
      "Collect invoice, payment proof, product photos, and seller chats. File complaint on National Consumer Helpline 1915 or e-daakhil.",
    tags: ["consumer", "fake", "refund", "1915", "e-daakhil"],
  },
  {
    topic: "Mutual Consent Divorce",
    prompt: "mutual consent divorce procedure in india",
    response:
      "Mutual consent divorce generally requires one year separation, joint petition under Section 13B, first motion, cooling period, second motion, and decree.",
    tags: ["divorce", "13b", "family", "court"],
  },
  {
    topic: "Tenant Deposit Dispute",
    prompt: "landlord not returning security deposit",
    response:
      "Send written notice with evidence of handover and payment. If unresolved, file civil/consumer complaint depending on agreement and facts.",
    tags: ["tenant", "landlord", "deposit", "rent"],
  },
  {
    topic: "Domestic Violence Help",
    prompt: "domestic violence legal help and protection",
    response:
      "Under the Protection of Women from Domestic Violence Act, a victim can seek protection order, residence order, monetary relief, and police support.",
    tags: ["domestic", "violence", "protection", "women"],
  },
  {
    topic: "Arrest Rights",
    prompt: "rights if police arrest me",
    response:
      "A person has rights such as being informed of grounds of arrest, informing family/friend, legal counsel access, and production before magistrate within 24 hours.",
    tags: ["arrest", "police", "rights", "24 hours"],
  },
];

export type LegalLaw = {
  act: string;
  section?: string;
  title: string;
  description: string;
  tags: string[];
};

export const INDIAN_LAWS_DATASET: LegalLaw[] = [
  // ================= CRIMINAL LAWS =================
  {
    act: "Bharatiya Nyaya Sanhita 2023",
    section: "Section 103",
    title: "Murder",
    description: "Punishment for murder includes death penalty or life imprisonment.",
    tags: ["murder", "crime"],
  },
  {
    act: "Bharatiya Nyaya Sanhita 2023",
    section: "Section 351",
    title: "Criminal Intimidation",
    description: "Punishment for threatening a person.",
    tags: ["threat", "crime"],
  },
  {
    act: "Indian Penal Code 1860",
    section: "Section 420",
    title: "Cheating",
    description: "Punishment for fraud and cheating.",
    tags: ["fraud", "cheating"],
  },
  {
    act: "Indian Penal Code 1860",
    section: "Section 376",
    title: "Rape",
    description: "Punishment for sexual assault.",
    tags: ["rape", "crime"],
  },

  // ================= PROCEDURE LAW =================
  {
    act: "Code of Criminal Procedure 1973",
    section: "Section 41",
    title: "Arrest without warrant",
    description: "Police can arrest without warrant in certain cases.",
    tags: ["arrest", "police"],
  },
  {
    act: "Code of Criminal Procedure 1973",
    section: "Section 50",
    title: "Right to know grounds of arrest",
    description: "Arrested person must be informed of reasons.",
    tags: ["rights", "arrest"],
  },

  // ================= CIVIL LAW =================
  {
    act: "Code of Civil Procedure 1908",
    title: "Civil Case Procedure",
    description: "Defines process for civil disputes in courts.",
    tags: ["civil", "court"],
  },

  // ================= CYBER LAW =================
  {
    act: "Information Technology Act 2000",
    section: "Section 66",
    title: "Hacking",
    description: "Punishment for hacking and cyber crimes.",
    tags: ["cyber", "hack"],
  },
  {
    act: "Information Technology Act 2000",
    section: "Section 43",
    title: "Data Theft",
    description: "Penalty for unauthorized access and data theft.",
    tags: ["data", "cyber"],
  },

  // ================= CONSUMER LAW =================
  {
    act: "Consumer Protection Act 2019",
    title: "Consumer Rights",
    description: "Protects consumers from unfair practices.",
    tags: ["consumer", "refund"],
  },

  // ================= FAMILY LAW =================
  {
    act: "Hindu Marriage Act 1955",
    section: "Section 13B",
    title: "Mutual Divorce",
    description: "Divorce by mutual consent.",
    tags: ["divorce"],
  },
  {
    act: "Hindu Succession Act 1956",
    title: "Inheritance",
    description: "Defines property inheritance rules.",
    tags: ["property", "family"],
  },

  // ================= WOMEN PROTECTION =================
  {
    act: "Domestic Violence Act 2005",
    title: "Protection of Women",
    description: "Provides protection from domestic abuse.",
    tags: ["women", "violence"],
  },
  {
    act: "POSH Act 2013",
    title: "Workplace Harassment",
    description: "Protection against sexual harassment at workplace.",
    tags: ["harassment", "work"],
  },

  // ================= LABOUR LAW =================
  {
    act: "Payment of Wages Act 1936",
    title: "Salary Protection",
    description: "Ensures timely salary payment.",
    tags: ["salary", "job"],
  },
  {
    act: "Minimum Wages Act 1948",
    title: "Minimum Wage",
    description: "Fixes minimum wages for workers.",
    tags: ["salary", "labor"],
  },

  // ================= PROPERTY LAW =================
  {
    act: "Transfer of Property Act 1882",
    title: "Property Transfer",
    description: "Rules for transfer of property.",
    tags: ["property"],
  },

  // ================= TRAFFIC LAW =================
  {
    act: "Motor Vehicles Act 1988",
    section: "Section 185",
    title: "Drunk Driving",
    description: "Punishment for driving under alcohol influence.",
    tags: ["traffic", "driving"],
  },

  // ================= TAX LAW =================
  {
    act: "GST Act 2017",
    title: "Goods and Services Tax",
    description: "Indirect tax system in India.",
    tags: ["tax", "gst"],
  },

  // ================= ENVIRONMENT LAW =================
  {
    act: "Environment Protection Act 1986",
    title: "Environmental Protection",
    description: "Protection of environment and pollution control.",
    tags: ["environment"],
  },

  // ================= RIGHT & CONSTITUTION =================
  {
    act: "Constitution of India",
    section: "Article 21",
    title: "Right to Life",
    description: "Fundamental right to life and liberty.",
    tags: ["rights"],
  },
  {
    act: "Constitution of India",
    section: "Article 19",
    title: "Freedom",
    description: "Freedom of speech and expression.",
    tags: ["freedom"],
  },
];
