import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
const useSubmitQuizResult = () => ({
  mutateAsync: async (data: any) => {
    const key = `quiz-results-${data.teamId || "default"}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    localStorage.setItem(key, JSON.stringify([...existing, data]));
    return data;
  },
});

const useGetQuizStats = () => ({
  data: null,
  isLoading: false,
});

const useGetTeamResults = (teamId: string) => {
  const results = JSON.parse(
    localStorage.getItem(`quiz-results-${teamId || "default"}`) || "[]"
  );

  return {
    data: { results },
    isLoading: false,
  };
};

const getGetQuizStatsQueryKey = () => ["quiz-stats"];
const getGetTeamResultsQueryKey = () => ["team-results"];

interface Question {
  q: string;
  options: { id: "A" | "B" | "C" | "D"; text: string }[];
}

type ResultKey = "DRIC" | "DEMON" | "HOVADO" | "PICUS" | "BRIGADA" | "HOVNOUDELAL" | "OJEB" | "REDITEL" | "KRAL";

interface ResultData {
  title: string;
  emoji: string;
  desc: string;
  breakdown: { label: string; pct: number }[];
}

const QUESTIONS: Question[] = [
  {
    q: "Budík zvoní ve 4:47. Co teď?",
    options: [
      { id: "A", text: "Z povinnosti vymáčkneš, stejně jsi od tří jen zíral do stropu." },
      { id: "B", text: "Odložíš ho. Čtyřikrát. Pozdní příchod pak svedeš na debila na silnici." },
      { id: "C", text: "Jaks nespal, tak problém nemáš. Načínáš další RedBull a jde se na to." },
      { id: "D", text: "Vstaneš sám. Dřív než budík. Ty takovej jsi." }
    ]
  },
  {
    q: "Hajzlík na stavbě vypadá jak z válečnýho filmu. Ty:",
    options: [
      { id: "A", text: "Dáš si radši prkno přes dvě tvárnice. Hotovo." },
      { id: "B", text: "Zatnout zuby a vydržet do oběda v hospodě. Nějak to dopadne." },
      { id: "C", text: "Za popelnicí. Rychle. Stydět se nestihneš." },
      { id: "D", text: "Přidáš svůj díl a zdokumentuješ partě." }
    ]
  },
  {
    q: "Kafe je základ. Tvoje specialitka:",
    options: [
      { id: "A", text: "Černý, bez řečí. Kdo mluví, ten nedělá." },
      { id: "B", text: "Co je zadarmo, to je dobrý." },
      { id: "C", text: "Kafe z pumpy a dva Monstery." },
      { id: "D", text: "Cold brew, přesně odměřený, ovesný mléko. Přinesl sis z domova." }
    ]
  },
  {
    q: "Někdo na partě dělá blbě. Ty:",
    options: [
      { id: "A", text: "Vytrheš mu to z ruky a uděláš to sám. Rychlejc a líp." },
      { id: "B", text: "Vidíš, mlčíš, neřešíš. Tvůj problém to fakt není." },
      { id: "C", text: "Zaburácíš na něj ze střechy. Nikdo neví co jsi říkal, ale nějak to zapůsobilo." },
      { id: "D", text: "S klidem vysvětlíš a předvedeš, jdeš přece příkladem." }
    ]
  },
  {
    q: "Jak probíhá tvůj oběd:",
    options: [
      { id: "A", text: "Cokoli co se dá sníst za 7 minut vestoje, ta práce se sama neudělá." },
      { id: "B", text: "S polysťákem pod zadkem, přesně 30 minut, ani o vteřinu míň." },
      { id: "C", text: "Hurá do hospody na meníčko, časová dotace výletu se neřeší." },
      { id: "D", text: "Připravil sis v neděli. Krabičky jsou popsaný a seřazený." }
    ]
  },
  {
    q: "Stav tvý přilby:",
    options: [
      { id: "A", text: "Promáčklá na třech místech. Každý důlek má svůj příběh." },
      { id: "B", text: "Technicky vzato na hlavě. Většinou." },
      { id: "C", text: "Nastříkaná, polepená, a zároveň ji nikdo neví kde je." },
      { id: "D", text: "Čistá, jméno uvnitř fixem. Každý den vzorně na škebli." }
    ]
  },
  {
    q: "Konec směny, ještě je co dodělávat. Ty:",
    options: [
      { id: "A", text: "Zůstaneš. Výmluvy nechceš slyšet ani od sebe." },
      { id: "B", text: "Odcházíš na minutu přesně. Na tom si dáš záležet." },
      { id: "C", text: "Zmizíš a na ráno nahlásíš, že je víc hotový než je." },
      { id: "D", text: "Aktualizuješ harmonogram a další ráno dáváš káravé kázání." }
    ]
  },
  {
    q: "Tvoje kára do práce:",
    options: [
      { id: "A", text: "Najeto 390 tisíc km. Jede na motlitbách každý ráno ji přemlouváš ať naskočí." },
      { id: "B", text: "Potřebuje malou opravu. Potřebuje ji dva roky." },
      { id: "C", text: "STK prošlá, šest prázdných plechovek na podlaze, palubka jak vánoční stromek." },
      { id: "D", text: "Každý týden ji myješ, tankuješ premium a na zrcátku pravidelně měníš voňavku." }
    ]
  }
];

const SCORE_MAP: { id: "A" | "B" | "C" | "D"; score: number }[] = [
  { id: "A", score: 1 },
  { id: "B", score: 2 },
  { id: "C", score: 3 },
  { id: "D", score: 4 },
];

function calcResultKey(answers: ("A" | "B" | "C" | "D")[]): ResultKey {
  const total = answers.reduce((sum, a) => {
    return sum + (SCORE_MAP.find(s => s.id === a)?.score ?? 2);
  }, 0);

  if (total <= 10) return "DRIC";
  if (total <= 13) return "DEMON";
  if (total <= 16) return "HOVADO";
  if (total <= 19) return "PICUS";
  if (total <= 21) return "BRIGADA";
  if (total <= 23) return "HOVNOUDELAL";
  if (total <= 26) return "OJEB";
  if (total <= 29) return "REDITEL";
  return "KRAL";
}

const RESULTS: Record<ResultKey, ResultData> = {
  DRIC: {
    title: "Dříč tělem i duší",
    emoji: "🔨",
    desc: "Řídíš se heslem, že hrubé násilí předčí i japonskou techniku. Makáš víc než je fyzicky doporučeno. Třikrát výhřeznutá plotýnka? No a, jsi přece stará škola. Ostatní tě obdivují a zároveň se tě tak trochu bojí. Jen tak dál, bez tebe to nepůjde!",
    breakdown: [
      { label: "Práce", pct: 82 },
      { label: "Nadávání", pct: 8 },
      { label: "Přestávky", pct: 5 },
      { label: "Dokazování ostatním", pct: 5 },
    ]
  },
  DEMON: {
    title: "Lešenářskej Démon",
    emoji: "🦺",
    desc: "Tam kde ostatní vidí smrt, ty vidíš nejlepší výhled. Lešení je tvůj domov, výška tvůj kamarád. Bezpečnostní pokyny jsi viděl z dálky. BOZP a smrti se směješ do tváře.",
    breakdown: [
      { label: "Práce ve výšce", pct: 60 },
      { label: "Ignorování bezpečnosti", pct: 22 },
      { label: "Strašení nováčků", pct: 13 },
      { label: "Přestávky", pct: 5 },
    ]
  },
  HOVADO: {
    title: "Chronický hovado",
    emoji: "🤬",
    desc: "Máš názor na všechno a sdílíš ho. Nahlas. Hned. Projekt tě irituje, šéf tě irituje, počasí tě irituje. Přesto jsi tady každý den, protože víc tě irituje nic nedělat. Paradox.",
    breakdown: [
      { label: "Hádky", pct: 45 },
      { label: "Práce", pct: 25 },
      { label: "Kouření", pct: 20 },
      { label: "Obviňování ostatních", pct: 10 },
    ]
  },
  PICUS: {
    title: "Ten pičus s metrem",
    emoji: "📏",
    desc: "Metr z ruky skoro nedáš. Kdokoli něco udělá, ty to odměříš. A pak řekneš, že je to vo vous vedle. Jsi technicky nepostradatelný a sociálně nesnesitelný. Dokonalá rovnováha.",
    breakdown: [
      { label: "Měření", pct: 52 },
      { label: "Kritizování ostatních", pct: 28 },
      { label: "Čtení návodů", pct: 15 },
      { label: "Skutečná práce", pct: 5 },
    ]
  },
  BRIGADA: {
    title: "Brigádník za trest",
    emoji: "😬",
    desc: "Nevíš přesně jak ses tady ocitl. Máš pocit, že to bylo buď soudní rozhodnutí nebo sázka. Tvůj výraz říká 'ještě osm hodin'. Furt nevíš kde se co bere a jak se to dělá, ale tváříš se, že ano.",
    breakdown: [
      { label: "Tváření se, že pracuje", pct: 40 },
      { label: "Psaní zpráv na mobilu", pct: 30 },
      { label: "Práce", pct: 15 },
      { label: "Čekání na konec směny", pct: 15 },
    ]
  },
  HOVNOUDELAL: {
    title: "Mistr Hovnoudělal",
    emoji: "💩",
    desc: "Pracuješ. Jen pomalu. A s přestávkama. A někdy zapomeneš co jsi dělal. Nářadí ztrácíš způsobem, který věda nedokáže vysvětlit. Ale jsi tady každý den, a to se počítá. Nějak.",
    breakdown: [
      { label: "Kouření", pct: 48 },
      { label: "Hledání nářadí", pct: 30 },
      { label: "Práce", pct: 12 },
      { label: "Předstírání aktivity", pct: 10 },
    ]
  },
  OJEB: {
    title: "Velmistr Ojebu",
    emoji: "😈",
    desc: "Jsi mistr přesunu. Z místa A na místo B. Pak zpátky. Vždy vypadáš zaneprázdněně, nikdy nevíš kde přesně jsi. Výmluvy máš připravené na každou situaci. Jsi živoucí legenda, ale nikdo neví čeho přesně.",
    breakdown: [
      { label: "Vymýšlení výmluv", pct: 35 },
      { label: "Přesuny mezi místy", pct: 30 },
      { label: "Schování se", pct: 25 },
      { label: "Náhodná práce", pct: 10 },
    ]
  },
  REDITEL: {
    title: "Ředitel nepráce",
    emoji: "🪑",
    desc: "Práce je pro ostatní. Ty koordinuješ. Tedy ukazuješ prstem a telefonuješ. Máš schovanou skládací stoličku na každém projektu. Nikdo ji nikdy nenašel. Jsi záhadou a inspirací.",
    breakdown: [
      { label: "Zadávání úkolů ostatním", pct: 40 },
      { label: "Přestávky na kávu", pct: 30 },
      { label: "Telefonáty", pct: 20 },
      { label: "Práce", pct: 10 },
    ]
  },
  KRAL: {
    title: "Král Dodělámezejtra",
    emoji: "👑",
    desc: "Zítra je taky den. A pozítří taky. Máš plán — jen ne na dnes. Odklady jsou tvou superschopností. Jsi tak přesvědčivý při vysvětlování proč to nestihneš, že ti to lidi věří. Génius.",
    breakdown: [
      { label: "Plánování na zítřek", pct: 50 },
      { label: "Odkládání", pct: 35 },
      { label: "Vysvětlování proč to nestihne", pct: 10 },
      { label: "Práce", pct: 5 },
    ]
  },
};

const RESULT_ORDER: ResultKey[] = ["DRIC", "DEMON", "HOVADO", "PICUS", "BRIGADA", "HOVNOUDELAL", "OJEB", "REDITEL", "KRAL"];
const POSITION_LABELS = ["A", "B", "C", "D"] as const;

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}


function getTeamIdFromPath(): string | null {
  const match = window.location.pathname.match(/^\/team\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

const ADMIN_TEAM_ID = (() => {
  const match = window.location.pathname.match(/^\/team\/([a-z0-9]+)\/admin$/i);
  return match ? match[1] : null;
})();

const IS_OWNER_PAGE = window.location.pathname === "/owner" || window.location.pathname === "/admin";

function generateTeamId(): string {
  return Math.random().toString(36).slice(2, 8);
}

export default function App() {
  const [gameState, setGameState] = useState<"landing" | "quiz" | "results" | "stats">("landing");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<("A" | "B" | "C" | "D")[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
  const [resultKey, setResultKey] = useState<ResultKey>("DRIC");
  const [nickname, setNickname] = useState("");
  const [teamId, setTeamId] = useState<string | null>(() => getTeamIdFromPath());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const submittedRef = useRef(false);

  const submitMutation = useSubmitQuizResult();
  const { data: globalStats } = useGetQuizStats();
  const { data: teamResultsData, isLoading: teamResultsLoading, dataUpdatedAt, refetch: refetchTeamResults } = useGetTeamResults(
    teamId ?? "",
    { query: {
      enabled: !!teamId && (gameState === "stats" || !!ADMIN_TEAM_ID),
      queryKey: getGetTeamResultsQueryKey(teamId ?? ""),
      refetchInterval: ADMIN_TEAM_ID ? 30000 : false,
    }}
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (gameState === "results" && !submittedRef.current) {
      submittedRef.current = true;
      submitMutation.mutate(
        { data: { resultType: resultKey, teamId: teamId ?? undefined, nickname: nickname.trim() || undefined } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetQuizStatsQueryKey() });
            if (teamId) queryClient.invalidateQueries({ queryKey: getGetTeamResultsQueryKey(teamId) });
          }
        }
      );
    }
  }, [gameState, resultKey]);

  const handleStart = () => {
    setShuffledQuestions(QUESTIONS.map(q => ({ ...q, options: shuffleArray(q.options) })));
    setGameState("quiz");
    setCurrentQuestionIndex(0);
    setAnswers([]);
    submittedRef.current = false;
  };

  const handleAnswer = (answer: "A" | "B" | "C" | "D") => {
    const newAnswers = [...answers, answer];
    if (newAnswers.length < QUESTIONS.length) {
      setAnswers(newAnswers);
      setCurrentQuestionIndex(newAnswers.length);
    } else {
      const key = calcResultKey(newAnswers);
      setAnswers(newAnswers);
      setResultKey(key);
      setGameState("results");
    }
  };

  const handleRetake = () => {
    setGameState("landing");
    setAnswers([]);
    setCurrentQuestionIndex(0);
  };

  const handleShowStats = () => {
    setGameState("stats");
  };

  const handleCreateTeam = () => {
    const id = generateTeamId();
    window.history.pushState({}, "", `/team/${id}`);
    setTeamId(id);
  };

  const handleCopyTeamLink = () => {
    const link = `${window.location.origin}/team/${teamId}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "Odkaz zkopírován!",
        description: "Pošli ho partě — ať se přidají.",
        className: "bg-primary text-primary-foreground border-none font-bold",
      });
    });
  };

  const handleShare = () => {
    const res = RESULTS[resultKey];
    const text = `Udělal jsem kvíz Stavební dělník a jsem ${res.title} ${res.emoji} — vyzkoušej to taky!`;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Zkopírováno!",
        description: "Teď to pošli partě.",
        className: "bg-primary text-primary-foreground border-none font-bold",
      });
    });
  };

  const displayStats = submitMutation.data ?? globalStats;

  const getCount = (key: ResultKey): number => {
    if (!displayStats?.counts) return 0;
    return displayStats.counts.find(c => c.resultType === key)?.count ?? 0;
  };

  if (IS_OWNER_PAGE) return <OwnerPage />;

  if (ADMIN_TEAM_ID) {
    const results = teamResultsData?.results ?? [];
    const uniquePlayers = new Set(results.map(r => r.nickname ?? "")).size;
    const mostPopular = RESULT_ORDER.reduce<ResultKey | null>((best, k) => {
      const cnt = results.filter(r => r.resultType === k).length;
      const bestCnt = best ? results.filter(r => r.resultType === best).length : 0;
      return cnt > bestCnt ? k : best;
    }, null);

    return (
      <div className="min-h-[100dvh] w-full concrete-pattern font-sans text-foreground">
        <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-12 space-y-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-4xl md:text-5xl font-display text-primary uppercase tracking-tight leading-none">
                🏗️ Admin — Parta
              </h1>
              <div className="mt-2 font-mono text-xl text-foreground/60 tracking-widest">{ADMIN_TEAM_ID}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <button
                onClick={() => refetchTeamResults()}
                disabled={teamResultsLoading}
                className="px-4 py-2 text-sm font-display uppercase tracking-widest bg-primary text-primary-foreground rounded hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50"
              >
                {teamResultsLoading ? "Načítám…" : "↺ Obnovit"}
              </button>
              {dataUpdatedAt > 0 && (
                <span className="text-xs text-muted-foreground">
                  Aktualizováno: {new Date(dataUpdatedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-primary/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-display text-primary">{results.length}</div>
              <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-1">Vyplnění</div>
            </div>
            <div className="bg-card border border-primary/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-display text-primary">{uniquePlayers}</div>
              <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-1">Hráčů</div>
            </div>
            <div className="bg-card border border-primary/20 rounded-xl p-4 text-center">
              <div className="text-4xl font-display text-primary">{mostPopular ? RESULTS[mostPopular].emoji : "—"}</div>
              <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-1">
                {mostPopular ? RESULTS[mostPopular].title : "Zatím nic"}
              </div>
            </div>
          </div>

          {results.length === 0 ? (
            teamResultsLoading ? (
              <p className="text-center text-muted-foreground py-20 text-lg animate-pulse">Načítám data…</p>
            ) : (
              <div className="bg-card border border-primary/20 rounded-xl p-12 text-center">
                <p className="text-muted-foreground text-lg">Žádné výsledky zatím.</p>
                <p className="text-muted-foreground/60 text-sm mt-2">Pošli odkaz partě: <span className="font-mono text-primary">{window.location.origin}/team/{ADMIN_TEAM_ID}</span></p>
              </div>
            )
          ) : (
            <>
              {/* Result distribution */}
              <div className="bg-card border border-primary/20 rounded-xl p-6">
                <h2 className="text-sm font-display uppercase tracking-widest text-muted-foreground mb-4">Rozložení typů</h2>
                <div className="space-y-3">
                  {RESULT_ORDER.map((key) => {
                    const count = results.filter(r => r.resultType === key).length;
                    if (count === 0) return null;
                    const pct = Math.round((count / results.length) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-display uppercase tracking-wide text-foreground/80">
                            {RESULTS[key].emoji} {RESULTS[key].title}
                          </span>
                          <span className="text-sm font-bold text-primary ml-2 shrink-0">
                            {count}× · {pct}%
                          </span>
                        </div>
                        <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Player list */}
              <div className="bg-card border border-primary/20 rounded-xl p-6">
                <h2 className="text-sm font-display uppercase tracking-widest text-muted-foreground mb-4">
                  Všechni hráči ({results.length})
                </h2>
                <div className="space-y-2">
                  {[...results].reverse().map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-background/60 border border-border rounded-lg px-4 py-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0">{RESULTS[r.resultType as ResultKey]?.emoji ?? "?"}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate text-base">
                            {r.nickname ?? <span className="text-muted-foreground italic">anonymní</span>}
                          </div>
                          <div className="text-xs text-muted-foreground font-display uppercase tracking-wide">
                            {RESULTS[r.resultType as ResultKey]?.title ?? r.resultType}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 text-right">
                        <div>{new Date(r.completedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" })}</div>
                        <div>{new Date(r.completedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="text-center text-xs text-muted-foreground/40 font-mono pb-4">
            Auto-refresh každých 30 s · Stavební kvíz admin
          </div>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center concrete-pattern p-4 md:p-8 overflow-hidden font-sans text-foreground">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {gameState === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-8 p-8 border-4 border-primary/20 bg-background/80 backdrop-blur-sm shadow-2xl rounded-xl relative overflow-hidden"
            >
              <div className="absolute -top-10 -left-10 text-[10rem] opacity-5 rotate-[-15deg] pointer-events-none">🚧</div>
              <div className="absolute -bottom-10 -right-10 text-[10rem] opacity-5 rotate-[15deg] pointer-events-none">🏗️</div>

              <div className="space-y-4 relative z-10">
                <h1 className="text-5xl md:text-6xl font-display text-primary tracking-tight uppercase drop-shadow-lg leading-none" data-testid="title-landing">
                  NO A JAKÝ TYP FACHMANA JSI TY?!
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-semibold" data-testid="subtitle-landing">
                  100% přesná diagnostika osobnosti. Bez garance vrácení peněz.
                </p>
              </div>

              <div className="relative z-10 w-full flex flex-col items-center gap-2">
                <label className="text-sm font-display uppercase tracking-widest text-muted-foreground" htmlFor="nickname-input">
                  Jak ti říkaj?
                </label>
                <input
                  id="nickname-input"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && nickname.trim()) handleStart(); }}
                  maxLength={30}
                  placeholder="Tvůj přezdívka..."
                  data-testid="input-nickname"
                  className="w-full md:w-80 px-5 py-3 text-lg bg-background border-2 border-border rounded text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors text-center font-semibold"
                />
              </div>

              <button
                onClick={handleStart}
                disabled={!nickname.trim()}
                data-testid="button-start"
                className="relative z-10 w-full md:w-auto px-12 py-6 text-2xl font-display uppercase tracking-widest bg-primary text-primary-foreground rounded hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_0_0_hsl(48,100%,30%)] hover:shadow-[0_2px_0_0_hsl(48,100%,30%)] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:shadow-[0_4px_0_0_hsl(48,100%,30%)]"
              >
                SPUSTIT KVÍZ
              </button>

              {teamId ? (
                <div className="relative z-10 w-full flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                    <span className="text-xs font-display uppercase tracking-widest text-primary">🏗️ Parta:</span>
                    <span className="text-sm font-bold text-foreground font-mono">{teamId}</span>
                  </div>
                  <button
                    onClick={handleCopyTeamLink}
                    data-testid="button-copy-team-link"
                    className="text-xs font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                  >
                    Zkopírovat odkaz pro partu
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCreateTeam}
                  data-testid="button-create-team"
                  className="relative z-10 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
                >
                  🏗️ Vytvořit odkaz pro partu
                </button>
              )}

              <button
                onClick={handleShowStats}
                data-testid="button-show-stats"
                className="relative z-10 text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
              >
                Zobrazit statistiky{teamId ? " party" : ""}
              </button>
            </motion.div>
          )}

          {gameState === "quiz" && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <div className="mb-8">
                <div className="flex justify-between font-display text-primary uppercase tracking-wider mb-2 text-sm md:text-base">
                  <span data-testid="text-progress-info">Otázka {currentQuestionIndex + 1} z {QUESTIONS.length}</span>
                  <span>{Math.round(((currentQuestionIndex + 1) / QUESTIONS.length) * 100)}% Hotovo</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentQuestionIndex / QUESTIONS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <div className="bg-card/90 backdrop-blur-md border border-border p-6 md:p-8 rounded-xl shadow-xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-foreground leading-snug" data-testid={`text-question-${currentQuestionIndex}`}>
                  {shuffledQuestions[currentQuestionIndex].q}
                </h2>

                <div className="space-y-4">
                  {shuffledQuestions[currentQuestionIndex].options.map((option, index) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(option.id)}
                      data-testid={`button-answer-${POSITION_LABELS[index]}`}
                      className="w-full text-left p-5 bg-background border-2 border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all group flex items-center gap-4 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-primary/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
                      <span className="relative z-10 w-8 h-8 flex items-center justify-center bg-muted text-muted-foreground font-display rounded group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                        {POSITION_LABELS[index]}
                      </span>
                      <span className="relative z-10 font-medium text-lg text-foreground/90 group-hover:text-foreground">
                        {option.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {gameState === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
              className="bg-card/95 backdrop-blur-xl border border-primary p-8 md:p-10 rounded-xl shadow-2xl text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,hsl(var(--primary))_10px,hsl(var(--primary))_20px)] opacity-50" />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                className="text-8xl md:text-[8rem] mb-4 drop-shadow-2xl"
                data-testid="text-result-emoji"
              >
                {RESULTS[resultKey].emoji}
              </motion.div>

              <h2 className="text-lg font-bold text-muted-foreground uppercase tracking-widest mb-1" data-testid="text-result-prefix">
                {nickname ? <>{nickname}, jsi</> : "Jsi"}
              </h2>

              <h1 className="text-4xl md:text-5xl font-display text-primary uppercase tracking-tight mb-6 leading-none" data-testid="text-result-title">
                {RESULTS[resultKey].title}
              </h1>

              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-8 max-w-xl mx-auto" data-testid="text-result-desc">
                {RESULTS[resultKey].desc}
              </p>

              {/* Activity breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8 text-left border border-primary/30 rounded-lg p-5 bg-primary/5"
                data-testid="section-breakdown"
              >
                <p className="text-xs font-display uppercase tracking-widest text-primary mb-4 text-center">
                  Jak trávíš čas na staveništi
                </p>
                <div className="space-y-3">
                  {RESULTS[resultKey].breakdown.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-foreground/80">{item.label}</span>
                        <span className="text-sm font-bold text-primary ml-3 shrink-0">{item.pct} %</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.pct}%` }}
                          transition={{ duration: 0.6, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Global stats */}
              {displayStats && displayStats.counts && displayStats.total > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-8 text-left border border-border rounded-lg p-5 bg-background/50"
                  data-testid="section-stats"
                >
                  <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-4 text-center">
                    Statistiky všech {displayStats.total} hráčů
                  </p>
                  <div className="space-y-2">
                    {RESULT_ORDER.map((key) => {
                      const count = getCount(key);
                      const pct = displayStats.total > 0 ? Math.round((count / displayStats.total) * 100) : 0;
                      const isMe = key === resultKey;
                      return (
                        <div key={key} data-testid={`stat-bar-${key}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-display uppercase tracking-wide truncate ${isMe ? "text-primary" : "text-muted-foreground"}`}>
                              {RESULTS[key].emoji} {RESULTS[key].title}
                              {isMe && <span className="ml-2 text-primary font-bold">← ty</span>}
                            </span>
                            <span className={`text-xs font-bold ml-2 shrink-0 ${isMe ? "text-primary" : "text-muted-foreground"}`}>
                              {pct} %
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${isMe ? "bg-primary" : "bg-muted-foreground/40"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: 0.6 }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleRetake}
                  data-testid="button-retake"
                  className="w-full sm:w-auto px-8 py-4 bg-muted text-foreground font-display uppercase tracking-wider rounded hover:bg-muted-foreground/20 transition-colors"
                >
                  ZKUSIT ZNOVU
                </button>
                <button
                  onClick={handleShare}
                  data-testid="button-share"
                  className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground font-display uppercase tracking-wider rounded hover:bg-primary/90 transition-colors"
                >
                  SDÍLET VÝSLEDEK
                </button>
                <button
                  onClick={handleShowStats}
                  data-testid="button-show-stats-results"
                  className="w-full sm:w-auto px-8 py-4 bg-muted text-foreground font-display uppercase tracking-wider rounded hover:bg-muted-foreground/20 transition-colors"
                >
                  STATISTIKY PARTY
                </button>
              </div>
            </motion.div>
          )}
          {gameState === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-card/95 backdrop-blur-xl border border-primary/30 p-6 md:p-8 rounded-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,hsl(var(--primary))_10px,hsl(var(--primary))_20px)] opacity-50" />

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display text-primary uppercase tracking-tight leading-none">
                    Statistiky {teamId ? "party" : ""}
                  </h1>
                  {teamId && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground font-mono">parta: {teamId}</span>
                      <button
                        onClick={handleCopyTeamLink}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      >
                        kopírovat odkaz
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setGameState("landing")}
                  data-testid="button-stats-back"
                  className="text-sm font-display uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  ← Zpět
                </button>
              </div>

              {!teamId ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg mb-4">Nejsi v žádné partě.</p>
                  <button
                    onClick={() => { handleCreateTeam(); setGameState("landing"); }}
                    className="text-sm font-display uppercase tracking-widest text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
                  >
                    🏗️ Vytvořit odkaz pro partu
                  </button>
                </div>
              ) : teamResultsLoading ? (
                <p className="text-center text-muted-foreground py-12 text-lg animate-pulse">Načítám výsledky…</p>
              ) : !teamResultsData?.results.length ? (
                <p className="text-center text-muted-foreground py-12 text-lg">
                  Zatím žádné výsledky. Pošli odkaz partě! 🏗️
                </p>
              ) : (
                <>
                  {/* Summary counts */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                      <div className="text-4xl font-display text-primary">{teamResultsData.results.length}</div>
                      <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-1">Dokončených kvízů</div>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
                      <div className="text-4xl font-display text-primary">
                        {new Set(teamResultsData.results.map(r => r.nickname)).size}
                      </div>
                      <div className="text-xs font-display uppercase tracking-widest text-muted-foreground mt-1">Různých hráčů</div>
                    </div>
                  </div>

                  {/* Player list */}
                  <div className="mb-6">
                    <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-3">
                      Výsledky hráčů
                    </p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {[...teamResultsData.results].reverse().map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-background/60 border border-border rounded-lg px-4 py-2.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl shrink-0">{RESULTS[r.resultType as ResultKey]?.emoji ?? "?"}</span>
                            <div className="min-w-0">
                              <div className="font-bold text-foreground truncate">{r.nickname ?? "—"}</div>
                              <div className="text-xs text-muted-foreground font-display uppercase tracking-wide">
                                {RESULTS[r.resultType as ResultKey]?.title ?? r.resultType}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0 ml-3">
                            {new Date(r.completedAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}
                            {" "}
                            {new Date(r.completedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Result distribution */}
                  <div>
                    <p className="text-xs font-display uppercase tracking-widest text-muted-foreground mb-3">
                      Rozložení typů
                    </p>
                    <div className="space-y-2">
                      {RESULT_ORDER.map((key) => {
                        const count = teamResultsData.results.filter(r => r.resultType === key).length;
                        if (count === 0) return null;
                        const pct = Math.round((count / teamResultsData.results.length) * 100);
                        return (
                          <div key={key}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-display uppercase tracking-wide text-foreground/80">
                                {RESULTS[key].emoji} {RESULTS[key].title}
                              </span>
                              <span className="text-xs font-bold text-primary ml-2 shrink-0">
                                {count}× · {pct}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full bg-primary rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Toaster />
    </div>
  );
}
