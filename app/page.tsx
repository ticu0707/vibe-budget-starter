import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <span className="text-white font-bold text-xl tracking-tight">Vibe Budget</span>
        <Link
          href="/login"
          className="text-teal-300 hover:text-white text-sm font-medium transition-colors"
        >
          Intră în cont →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="inline-block bg-teal-500/10 border border-teal-500/30 text-teal-300 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          7 zile gratuit · Fără card
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
          Știi unde se duc
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-400">
            banii tăi?
          </span>
        </h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Cei mai mulți oameni ajung la sfârșitul lunii fără să știe ce s-a întâmplat cu
          salariul. Vibe Budget îți arată exact unde pleacă fiecare leu — și ce poți
          schimba de mâine.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-2xl transition-all hover:scale-105 shadow-lg shadow-teal-500/25"
          >
            Încearcă gratuit 7 zile
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all border border-white/20"
          >
            Am deja cont
          </Link>
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10">
          <p className="text-slate-400 text-sm uppercase tracking-widest mb-6">
            Sună familiar?
          </p>
          <div className="space-y-5">
            {[
              "Te uiți la soldul cardului și nu înțelegi cum ai ajuns aici — n-ai cumpărat nimic mare, dar banii tot au dispărut",
              "Îți propui în fiecare lună să pui ceva deoparte. Și în fiecare lună nu se întâmplă nimic",
              "Ai conturi la două-trei bănci și nici o idee clară care e situația reală",
              "Simți că ceva nu e în regulă cu finanțele tale, dar nu știi de unde să începi",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-orange-400 mt-0.5 flex-shrink-0 font-bold">→</span>
                <p className="text-slate-300">{item}</p>
              </div>
            ))}
          </div>
          <p className="text-white font-semibold mt-8 text-lg">
            Nu ești singurul. Și nu e vina ta — problema nu e voința, e lipsa de vizibilitate.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Cu Vibe Budget, totul devine clar
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">
            Nu mai ghicești. Nu mai estimezi. Știi.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              icon: "⚡",
              title: "Scapi de munca manuală din prima zi",
              desc: "Importi extrasul de la Revolut, ING sau BT în 30 de secunde. Tranzacțiile se categorisesc singure — tu nu faci nimic, iar imaginea e deja completă.",
            },
            {
              icon: "🎯",
              title: "Afli în sfârșit unde pleacă banii",
              desc: "Dashboard live cu ce ai câștigat, ce ai cheltuit și cât ai economisit luna asta. Fără calcule, fără foi Excel, fără surprize neplăcute pe 30.",
            },
            {
              icon: "📊",
              title: "Înțelegi tiparele care te costă",
              desc: "Rapoarte lunare care îți arată tendințele pe categorii, lună după lună. Prima dată când îți vezi finanțele ca un întreg — nu ca bucăți izolate.",
            },
            {
              icon: "🤖",
              title: "Ai un consilier financiar disponibil oricând",
              desc: "AI-ul citește datele tale reale și îți spune concret: unde pierzi bani, ce poți tăia fără să simți, cum îți atingi obiectivele mai repede.",
            },
          ].map(({ icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-7 transition-all group"
            >
              <span className="text-3xl mb-4 block">{icon}</span>
              <h3 className="text-white font-bold text-lg mb-2 group-hover:text-teal-300 transition-colors">
                {title}
              </h3>
              <p className="text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Authority */}
      <section className="max-w-2xl mx-auto px-6 pb-20 text-center">
        <p className="text-slate-500 leading-relaxed">
          Vibe Budget există pentru că majoritatea aplicațiilor de buget sunt ori prea
          complicate pentru uz zilnic, ori prea simple ca să fie utile cu adevărat. Am
          vrut ceva care se potrivește cu realitatea bancară din România — Revolut, ING,
          BT — și care să îți dea răspunsuri clare, nu mai multe întrebări.
        </p>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-br from-teal-500/20 to-orange-500/10 border border-white/10 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            7 zile gratuit. Fără card.
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            În 5 minute știi mai multe despre finanțele tale
            <br />
            decât în ultimele 6 luni.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-2xl transition-all hover:scale-105 shadow-lg shadow-teal-500/25"
          >
            Încearcă gratuit 7 zile
          </Link>
          <p className="text-slate-600 text-xs mt-4">
            Acces complet 7 zile. Continuarea necesită cod de acces.
          </p>
        </div>
      </section>

    </div>
  );
}
