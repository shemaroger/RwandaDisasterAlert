// import React, { useContext, createContext, useState, useEffect, ReactNode } from 'react';
// import { getItem, setItem, removeItem } from '../utils/storage';

// // Define the shape of the user object
// interface User {
//   email: string;
// }

// // Define the shape of the AuthContext
// interface AuthContextType {
//   user: User | null;
//   setUser: (user: User) => Promise<void>;
//   logout: () => Promise<void>;
// }

// // Create the AuthContext with a default value
// const AuthContext = createContext<AuthContextType>({
//   user: null,
//   setUser: async () => {},
//   logout: async () => {},
// });

// // Custom hook to use the AuthContext
// export const useAuth = () => useContext(AuthContext);

// // AuthProvider component
// export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   const [user, setUser] = useState<User | null>(null);

//   useEffect(() => {
//     const loadUser = async () => {
//       try {
//         const storedUser = await getItem('user');
//         if (storedUser) {
//           setUser(JSON.parse(storedUser));
//         }
//       } catch (error) {
//         console.error('Failed to load user:', error);
//       }
//     };
//     loadUser();
//   }, []);

//   const login = async (newUser: User) => {
//     try {
//       await setItem('user', JSON.stringify(newUser));
//       setUser(newUser);
//     } catch (error) {
//       console.error('Failed to save user:', error);
//       throw error;
//     }
//   };

//   const logout = async () => {
//     try {
//       await removeItem('user');
//       setUser(null);
//     } catch (error) {
//       console.error('Failed to remove user:', error);
//       throw error;
//     }
//   };

//   const contextValue: AuthContextType = {
//     user,
//     setUser: login,
//     logout
//   };

//   return (
//     <AuthContext.Provider value={contextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };