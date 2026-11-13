import Image from "next/image";
import Footer from "./footer";
import Header from "./header";

export default function Home() {
  return (
    <>
      <header>
        <Header />
      </header>
      <main className="my-2">
        <div className="flex-1">Main</div>
      </main>
      <footer className="mt-auto">
        <Footer />
      </footer>
    </>
  );
}
