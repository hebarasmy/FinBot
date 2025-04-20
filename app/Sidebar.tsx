// "use client"

// import Link from "next/link"
// import { Search, TrendingUp, Settings, LogOut } from "lucide-react"
// import { Button } from "../components/ui/button"

// const Sidebar = () => {
//   return (
//     <div className="w-64 bg-white h-screen flex flex-col border-r">
//       <div className="p-6">
//         <Link href="/" className="flex items-center mb-8">
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-[#622bd9] to-blue-500 bg-clip-text text-transparent">
//             Fin-Bot
//           </h1>
//         </Link>
//         <nav className="space-y-2">
//           <Button variant="ghost" className="w-full justify-start" asChild>
//             <Link href="/search">
//               <Search className="mr-2 h-4 w-4" />
//               Search Engine
//             </Link>
//           </Button>
//           <Button variant="ghost" className="w-full justify-start" asChild>
//             <Link href="/trending">
//               <TrendingUp className="mr-2 h-4 w-4" />
//               Trending
//             </Link>
//           </Button>
//         </nav>
//       </div>
//       <div className="mt-auto p-6">
//         <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Settings</h3>
//         <Button variant="ghost" className="w-full justify-start" asChild>
//           <Link href="/settings">
//             <Settings className="mr-2 h-4 w-4" />
//             Settings
//           </Link>
//         </Button>
//         <Button variant="ghost" className="w-full justify-start" asChild>
//           <Link href="/logout">
//             <LogOut className="mr-2 h-4 w-4" />
//             Logout
//           </Link>
//         </Button>
//       </div>
//     </div>
//   )
// }

// export default Sidebar
// "use client"

// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { Search, TrendingUp, Settings, LogOut, User } from "lucide-react"
// import { Button } from "./ui/button"
// import { logoutUser } from "@/actions/auth-actions"

// const Sidebar = () => {
//   const router = useRouter()

//   // Handle logout
//   const handleLogout = async () => {
//     await logoutUser()
//     router.push("/login")
//   }

//   return (
//     <div className="w-64 bg-white h-screen flex flex-col border-r">
//       <div className="p-6">
//         <Link href="/" className="flex items-center mb-8">
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-[#622bd9] to-blue-500 bg-clip-text text-transparent">
//             Fin-Bot
//           </h1>
//         </Link>
//         <nav className="space-y-2">
//           <Button variant="ghost" className="w-full justify-start" asChild>
//             <Link href="/search">
//               <Search className="mr-2 h-4 w-4" />
//               Search Engine
//             </Link>
//           </Button>
//           <Button variant="ghost" className="w-full justify-start" asChild>
//             <Link href="/trending">
//               <TrendingUp className="mr-2 h-4 w-4" />
//               Trending
//             </Link>
//           </Button>
//         </nav>
//       </div>
//       <div className="mt-auto p-6">
//         <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Account</h3>
//         <Button variant="ghost" className="w-full justify-start" asChild>
//           <Link href="/profile">
//             <User className="mr-2 h-4 w-4" />
//             Profile
//           </Link>
//         </Button>
//         <Button variant="ghost" className="w-full justify-start" asChild>
//           <Link href="/settings">
//             <Settings className="mr-2 h-4 w-4" />
//             Settings
//           </Link>
//         </Button>
//         <Button
//           variant="ghost"
//           className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
//           onClick={handleLogout}
//         >
//           <LogOut className="mr-2 h-4 w-4" />
//           Logout
//         </Button>
//       </div>
//     </div>
//   )
// }

// export default Sidebar
// "use client"

// import Link from "next/link"
// import { useRouter } from "next/navigation"
// import { Search, TrendingUp, LogOut, User } from "lucide-react"
// import { Button } from "./ui/button"
// import { logoutUser } from "@/actions/auth-actions"

// const Sidebar = () => {
//   const router = useRouter()

//   // Handle logout
//   const handleLogout = async () => {
//     await logoutUser()
//     router.push("/login")
//   }

//   return (
//     <div className="w-64 bg-white h-screen flex flex-col border-r">
//       <div className="p-6">
//         <Link href="/" className="flex items-center mb-8">
//           <h1 className="text-2xl font-bold bg-gradient-to-r from-[#622bd9] to-blue-500 bg-clip-text text-transparent">
//             Fin-Bot
//           </h1>
//         </Link>
//         <nav className="space-y-2">
//           <Button variant="ghost" className="w-full justify-start" asChild>
//             <Link href="/search">
//               <Search className="mr-2 h-4 w-4" />
//               Search Engine
//             </Link>
//           </Button>
//           <Button variant="ghost" className="w-full justify-start" asChild>
//             <Link href="/trending">
//               <TrendingUp className="mr-2 h-4 w-4" />
//               Trending
//             </Link>
//           </Button>
//         </nav>
//       </div>
//       <div className="mt-auto p-6">
//         <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2">Account</h3>
//         <Button variant="ghost" className="w-full justify-start" asChild>
//           <Link href="/profile">
//             <User className="mr-2 h-4 w-4" />
//             Profile
//           </Link>
//         </Button>
//         <Button
//           variant="ghost"
//           className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
//           onClick={handleLogout}
//         >
//           <LogOut className="mr-2 h-4 w-4" />
//           Logout
//         </Button>
//       </div>
//     </div>
//   )
// }

// export default Sidebar

