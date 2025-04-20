import { Card } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-purple-50 to-slate-100 h-screen overflow-auto custom-scrollbar relative">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="relative mr-3">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>

        {/* Search Input */}
        <Card className="mb-6 border border-gray-200 shadow-sm relative rounded-lg">
          <div className="relative p-5 bg-white rounded-lg">
            <div className="flex flex-col gap-4">
              <div className="relative flex gap-3 w-full items-center">
                <Skeleton className="h-12 w-full rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
            </div>
          </div>
        </Card>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto mb-4 rounded-lg custom-scrollbar min-h-[50vh]">
          <div className="space-y-6 min-h-full">
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-lg border border-slate-200 shadow-sm">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-6 w-64 mb-2" />
              <Skeleton className="h-4 w-96 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
                <Skeleton className="h-16 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 border-t border-slate-200 bg-white/50 mt-8">
          <Skeleton className="h-4 w-96 mx-auto" />
        </div>
      </div>
    </div>
  )
}
