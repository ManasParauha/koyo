import React from 'react'

interface PageProps {
  params: Promise<{
    restaurantId: string
    tableId: string
  }>
}

export default async function MenuPage({ params }: PageProps) {
  const { restaurantId, tableId } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-950 text-zinc-100">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-indigo-500">Menu Page</h1>
        <p className="text-zinc-400">
          Welcome to Koyo. You are viewing the menu for restaurant <span className="font-mono text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">{restaurantId}</span> at table <span className="font-mono text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded">{tableId}</span>.
        </p>
      </div>
    </main>
  )
}
