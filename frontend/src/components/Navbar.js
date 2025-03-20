// import React from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { useAuth } from '../AuthContext';

// function Navbar() {
//   const { isAuthenticated, logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <nav className="bg-blue-500 p-4 shadow-md">
//       <div className="max-w-4xl mx-auto flex justify-between items-center">
//         <h2 className="text-white text-xl font-semibold">Twitter Bot</h2>
//         <div className="space-x-4">
//           {isAuthenticated ? (
//             <>
//               <Link
//                 to="/"
//                 className="text-white hover:bg-blue-600 px-3 py-2 rounded-md transition"
//               >
//                 Generate
//               </Link>
//               <Link
//                 to="/review"
//                 className="text-white hover:bg-blue-600 px-3 py-2 rounded-md transition"
//               >
//                 Review
//               </Link>
//               <Link
//                 to="/schedule"
//                 className="text-white hover:bg-blue-600 px-3 py-2 rounded-md transition"
//               >
//                 Schedule
//               </Link>
//               <button
//                 onClick={handleLogout}
//                 className="text-white hover:bg-red-600 px-3 py-2 rounded-md transition"
//               >
//                 Logout
//               </button>
//             </>
//           ) : (
//             <Link
//               to="/login"
//               className="text-white hover:bg-blue-600 px-3 py-2 rounded-md transition"
//             >
//               Login
//             </Link>
//           )}
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default Navbar;