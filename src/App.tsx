import React, { useState, useEffect } from "react";
import {
  Car,
  MapPin,
  Send,
  ShieldCheck,
  Plus,
  ArrowRight,
  LogOut,
  MessageSquare,
  User,
  AlertCircle,
  Calendar,
  Search,
  Trash2,
} from "lucide-react";

// --- TYPES ---
type ViewState = "auth" | "feed" | "create" | "chat";

interface RideItem {
  id: string;
  type: "offer" | "request";
  publisher: string;
  fromLocation: string;
  toDestination: string;
  category: "תל אביב" | "ירושלים" | "רכבת" | "מחלף אורנית" | "אריאל" | "שונות";
  dateStr: string;
  time: string;
  seats?: number;
  note?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

// Settlement Mapping by Gematria Codes
const SETTLEMENTS: Record<string, string> = {
  "370": "לשם",
  "288": "ברוכין",
  "121": "פדואל",
  "124": "עלי זהב",
};

const CATEGORIES = [
  "הכל",
  "תל אביב",
  "ירושלים",
  "רכבת",
  "מחלף אורנית",
  "אריאל",
  "שונות",
] as const;

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>("auth");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [inputCode, setInputCode] = useState<string>("");
  const [settlementName, setSettlementName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");

  // טעינת נסיעות שמורות מהזיכרון המקומי או רשימה ריקה בהתחלה
  const [rides, setRides] = useState<RideItem[]>(() => {
    try {
      const savedRides = localStorage.getItem("trampist_rides");
      return savedRides ? JSON.parse(savedRides) : [];
    } catch {
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>("הכל");
  const [feedTab, setFeedTab] = useState<"all" | "offers" | "requests">("all");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("הכל");
  const [filterTime, setFilterTime] = useState<string>("");

  // Create Ride Form State
  const [createType, setCreateType] = useState<"offer" | "request">("offer");
  const [fromLoc, setFromLoc] = useState<string>("");
  const [toDestCategory, setToDestCategory] =
    useState<RideItem["category"]>("תל אביב");
  const [specificDest, setSpecificDest] = useState<string>("");
  const [rideDate, setRideDate] = useState<string>("היום");
  const [rideTime, setRideTime] = useState<string>("עכשיו");
  const [seatsCount, setSeatsCount] = useState<number>(3);
  const [rideNote, setRideNote] = useState<string>("");

  // Chat State
  const [activeChatRide, setActiveChatRide] = useState<RideItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>("");

  useEffect(() => {
    const savedUser = localStorage.getItem("trampist_user");
    const savedSettlement = localStorage.getItem("trampist_settlement");
    if (savedUser && savedSettlement) {
      setUserName(savedUser);
      setSettlementName(savedSettlement);
      setIsLoggedIn(true);
      setCurrentView("feed");
    }
  }, []);

  // שמירת הנסיעות אוטומטית בזיכרון בכל פעם שהן משתנות
  useEffect(() => {
    localStorage.setItem("trampist_rides", JSON.stringify(rides));
  }, [rides]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setAuthError("נא להזין שם פרטי");
      return;
    }

    const matchedSettlement = SETTLEMENTS[inputCode.trim()];
    if (!matchedSettlement) {
      setAuthError("קוד יישוב שגוי. פנה למנהל הקהילה לקבלת הקוד.");
      return;
    }

    localStorage.setItem("trampist_user", userName.trim());
    localStorage.setItem("trampist_settlement", matchedSettlement);
    setSettlementName(matchedSettlement);
    setIsLoggedIn(true);
    setCurrentView("feed");
    setAuthError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("trampist_user");
    localStorage.removeItem("trampist_settlement");
    setIsLoggedIn(false);
    setUserName("");
    setInputCode("");
    setSettlementName("");
    setCurrentView("auth");
  };

  const handleCreateRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLoc.trim()) return;

    const fullDestination = specificDest.trim()
      ? `${toDestCategory} (${specificDest.trim()})`
      : toDestCategory;

    const newRide: RideItem = {
      id: Date.now().toString(),
      type: createType,
      publisher: userName,
      fromLocation: fromLoc.trim(),
      toDestination: fullDestination,
      category: toDestCategory,
      dateStr: rideDate,
      time: rideTime,
      seats: createType === "offer" ? seatsCount : undefined,
      note: rideNote.trim(),
      createdAt: "זה עתה",
    };

    setRides([newRide, ...rides]);
    setCurrentView("feed");
    setFromLoc("");
    setSpecificDest("");
    setRideNote("");
  };

  const handleDeleteRide = (id: string) => {
    if (window.confirm("האם למחוק את הנסיעה הזו?")) {
      setRides(rides.filter((r) => r.id !== id));
    }
  };

  const openChat = (ride: RideItem) => {
    setActiveChatRide(ride);
    setMessages([
      {
        id: "1",
        sender: ride.publisher,
        text: `היי, ראיתי את הפרסום שלך לגבי הנסיעה מ-${ride.fromLocation} אל ${ride.toDestination} (${ride.dateStr} ב-${ride.time}). רלוונטי?`,
        time: "עכשיו",
      },
    ]);
    setCurrentView("chat");
  };

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      text: newMessageText.trim(),
      time: "עכשיו",
    };

    setMessages([...messages, msg]);
    setNewMessageText("");
  };

  const sendQuickReply = (text: string) => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: userName,
      text: text,
      time: "עכשיו",
    };
    setMessages([...messages, msg]);
  };

  // --- RENDER VIEWS ---

  if (!isLoggedIn || currentView === "auth") {
    return (
      <div
        className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-right"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Car className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">
              הטרמפיסט - קארפול קהילתי
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              הזן קוד יישוב סודי כדי להיכנס
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                שם פרטי (איך יזהו אותך)
              </label>
              <div className="relative">
                <User className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="למשל: דנה כהן"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                קוד יישוב סודי
              </label>
              <div className="relative">
                <ShieldCheck className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="הזן קוד יישוב"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                את הקוד ניתן לקבל בקבוצת הוואטסאפ היישובית.
              </p>
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-rose-500 text-sm bg-rose-50 p-3 rounded-xl border border-rose-100">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              <span>כניסה לאפליקציה</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- CREATE RIDE VIEW ---
  if (currentView === "create") {
    return (
      <div
        className="min-h-screen bg-slate-50 flex flex-col items-center justify-start p-4 font-sans text-right"
        dir="rtl"
      >
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 border border-slate-100 my-auto">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                פרסום נסיעה / בקשה
              </h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
                📍 יישוב {settlementName}
              </span>
            </div>
            <button
              onClick={() => setCurrentView("feed")}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium"
            >
              ביטול
            </button>
          </div>

          <form onSubmit={handleCreateRide} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCreateType("offer")}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                  createType === "offer"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                🚗 מציע נסיעה
              </button>
              <button
                type="button"
                onClick={() => setCreateType("request")}
                className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                  createType === "request"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                🙋‍♂️ צריך טרמפ
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                מאיפה יוצאים? (נקודת מוצא חופשית)
              </label>
              <input
                type="text"
                value={fromLoc}
                onChange={(e) => setFromLoc(e.target.value)}
                placeholder="למשל: רחוב הכלניות, בית מספר 4..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                לאן? (בחר קטגוריה)
              </label>
              <select
                value={toDestCategory}
                onChange={(e) =>
                  setToDestCategory(e.target.value as RideItem["category"])
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              >
                <option value="תל אביב">תל אביב</option>
                <option value="ירושלים">ירושלים</option>
                <option value="רכבת">רכבת</option>
                <option value="מחלף אורנית">מחלף אורנית</option>
                <option value="אריאל">אריאל</option>
                <option value="שונות">שונות</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                פירוט יעד נוסף (אופציונלי)
              </label>
              <input
                type="text"
                value={specificDest}
                onChange={(e) => setSpecificDest(e.target.value)}
                placeholder="למשל: עזריאלי / רכבת בנימינה / אוניברסיטה"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  יום
                </label>
                <select
                  value={rideDate}
                  onChange={(e) => setRideDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  <option value="היום">היום</option>
                  <option value="מחר">מחר</option>
                  <option value="יומיים קרובים">יומיים קרובים</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  שעה
                </label>
                <input
                  type="text"
                  value={rideTime}
                  onChange={(e) => setRideTime(e.target.value)}
                  placeholder="07:30 / עכשיו"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {createType === "offer" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  מקומות פנויים באוטו
                </label>
                <select
                  value={seatsCount}
                  onChange={(e) => setSeatsCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                >
                  <option value={1}>1 מקום</option>
                  <option value={2}>2 מקומות</option>
                  <option value={3}>3 מקומות</option>
                  <option value={4}>4+ מקומות</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                הערות נוספות (אופציונלי)
              </label>
              <input
                type="text"
                value={rideNote}
                onChange={(e) => setRideNote(e.target.value)}
                placeholder="למשל: משתתף בדלק, עם מזוודה..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 mt-2"
            >
              פרסם לכולם עכשיו 🚀
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- CHAT VIEW ---
  if (currentView === "chat" && activeChatRide) {
    return (
      <div
        className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto font-sans text-right shadow-lg"
        dir="rtl"
      >
        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              {activeChatRide.publisher[0]}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-800 text-sm">
                  {activeChatRide.publisher}
                </h3>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.2 rounded-full font-bold">
                  {settlementName}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                יעד: {activeChatRide.toDestination}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentView("feed")}
            className="text-slate-400 hover:text-slate-600 text-sm font-medium px-3 py-1 bg-slate-100 rounded-lg"
          >
            חזרה ללוח
          </button>
        </div>

        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          <div className="text-center my-2">
            <span className="text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
              צ'אט פרטי ומאובטח (יישוב {settlementName})
            </span>
          </div>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === userName ? "items-start" : "items-end"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  m.sender === userName
                    ? "bg-emerald-600 text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                }`}
              >
                <div className="text-[10px] opacity-70 mb-0.5">{m.sender}</div>
                <div>{m.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 bg-white border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => sendQuickReply("היי, באיזו שעה יוצאים בדיוק?")}
            className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full transition-all"
          >
            ⏰ באיזו שעה יוצאים?
          </button>
          <button
            onClick={() => sendQuickReply("איפה בדיוק נפגשים?")}
            className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full transition-all"
          >
            📍 איפה בדיוק נפגשים?
          </button>
          <button
            onClick={() => sendQuickReply("תודה רבה נתראה!")}
            className="whitespace-nowrap bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-full transition-all"
          >
            🙏 תודה רבה!
          </button>
        </div>

        <form
          onSubmit={sendChatMessage}
          className="p-3 bg-white border-t border-slate-100 flex gap-2"
        >
          <input
            type="text"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="הקלד הודעה..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all shadow-md"
          >
            <Send className="w-5 h-5 rotate-180" />
          </button>
        </form>
      </div>
    );
  }

  // --- FEED VIEW (MAIN HOME) ---
  const filteredRides = rides.filter((r) => {
    if (feedTab === "offers" && r.type !== "offer") return false;
    if (feedTab === "requests" && r.type !== "request") return false;
    if (selectedCategory !== "הכל" && r.category !== selectedCategory)
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchDest = r.toDestination.toLowerCase().includes(q);
      const matchPub = r.publisher.toLowerCase().includes(q);
      const matchFrom = r.fromLocation.toLowerCase().includes(q);
      if (!matchDest && !matchPub && !matchFrom) return false;
    }

    if (filterDate !== "הכל" && r.dateStr !== filterDate) return false;

    if (
      filterTime.trim() &&
      !r.time.toLowerCase().includes(filterTime.trim().toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <div
      className="min-h-screen bg-slate-100 flex flex-col max-w-md mx-auto font-sans text-right relative pb-24 shadow-xl"
      dir="rtl"
    >
      {/* Top Bar with Clear Settlement Name */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-slate-900 text-base leading-tight">
                הטרמפיסט
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                יישוב {settlementName}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              שלום, {userName}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="התנתק"
          className="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Tabs */}
      <div className="p-4 pb-2">
        <div className="grid grid-cols-3 gap-1 bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setFeedTab("all")}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              feedTab === "all"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600"
            }`}
          >
            הכל
          </button>
          <button
            onClick={() => setFeedTab("offers")}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              feedTab === "offers"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600"
            }`}
          >
            🚗 מציעים
          </button>
          <button
            onClick={() => setFeedTab("requests")}
            className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
              feedTab === "requests"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600"
            }`}
          >
            🙋‍♂️ מחפשים
          </button>
        </div>
      </div>

      {/* Search & Filters Panel */}
      <div className="px-4 py-2 space-y-2">
        <div className="relative">
          <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי יעד, מוצא או שם..."
            className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            <option value="הכל">כל הימים</option>
            <option value="היום">היום</option>
            <option value="מחר">מחר</option>
            <option value="יומיים קרובים">יומיים קרובים</option>
          </select>

          <input
            type="text"
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            placeholder="שעה (למשל 07:30)"
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="px-4 py-1 flex gap-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm ${
              selectedCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {filteredRides.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 mx-4 my-2">
            <div className="text-slate-300 mb-2 text-2xl">🚗</div>
            <p className="text-slate-500 text-sm">אין נסיעות פעילות כרגע</p>
            <p className="text-slate-400 text-xs mt-1">
              היה הראשון לפרסם נסיעה או בקשה לטרמפ!
            </p>
          </div>
        ) : (
          filteredRides.map((ride) => (
            <div
              key={ride.id}
              className={`bg-white rounded-2xl p-4 border shadow-sm transition-all relative overflow-hidden ${
                ride.type === "offer"
                  ? "border-emerald-100 hover:border-emerald-300"
                  : "border-amber-100 hover:border-amber-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      ride.type === "offer"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {ride.publisher[0]}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">
                      {ride.publisher}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {ride.createdAt}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {ride.category}
                  </span>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                      ride.type === "offer"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {ride.type === "offer" ? "🚗 מציע" : "🙋‍♂️ מחפש"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 my-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    מוצא:{" "}
                    <strong className="text-slate-900">
                      {ride.fromLocation}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 rotate-180" />
                  <span>
                    יעד:{" "}
                    <strong className="text-slate-900">
                      {ride.toDestination}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-xl mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {ride.dateStr}, שעה: {ride.time}
                    </span>
                  </div>
                  {ride.seats && (
                    <div className="font-medium text-emerald-600">
                      פנויים: {ride.seats} מקומות
                    </div>
                  )}
                </div>
              </div>

              {ride.note && (
                <p className="text-xs text-slate-500 bg-slate-50/50 p-2 rounded-lg mb-3 italic">
                  "{ride.note}"
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => openChat(ride)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>תיאום מהיר בצ'אט</span>
                </button>

                {/* כפתור מחיקה למפרסם הנסיעה */}
                {ride.publisher === userName && (
                  <button
                    onClick={() => handleDeleteRide(ride.id)}
                    title="מחק נסיעה"
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2.5 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={() => setCurrentView("create")}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-full shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>פרסם נסיעה / בקשה</span>
        </button>
      </div>
    </div>
  );
}
