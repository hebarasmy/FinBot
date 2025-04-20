import { Card } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1 bg-gradient-to-b from-purple-50 to-slate-100 min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center mb-8">
          <div className="h-10 w-10 mr-2">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>

        <Card className="mb-6 border shadow-sm">
          <div className="relative p-4 bg-white rounded-lg">
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2 w-full">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
