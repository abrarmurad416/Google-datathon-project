'use client';

import Head from "next/head";
import Landing from "../components/Landing"
import Features from "../components/Features"

export default function Home() {

  return (
    <>
      <Head>
        <title>AI Interviewer</title>
        <meta
          name="description"
          content="Interview with a trusted advisor, specifically tailored to the company you aspire to work at."
        />
      </Head>

      <main className="min-h-screen flex flex-col">
        <section>
          <Landing />
          <Features />
        </section>
      </main>
    </>
  );
}
