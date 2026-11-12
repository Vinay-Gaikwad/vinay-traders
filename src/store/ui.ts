import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface UIState { collapsed:boolean;commandOpen:boolean;mobileMore:boolean;setCommandOpen:(open:boolean)=>void;toggleSidebar:()=>void;setMobileMore:(open:boolean)=>void }
export const useUI=create<UIState>()(persist(set=>({collapsed:false,commandOpen:false,mobileMore:false,setCommandOpen:commandOpen=>set({commandOpen}),toggleSidebar:()=>set(s=>({collapsed:!s.collapsed})),setMobileMore:mobileMore=>set({mobileMore})}),{name:'vinay-traders-ui',partialize:state=>({collapsed:state.collapsed})}))
