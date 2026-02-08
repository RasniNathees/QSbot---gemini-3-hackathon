import { useEffect, useReducer, useState } from 'react'
import './App.css'
import NavBar from '@components/NavBar'
import { ThemeProvider } from '@/context/ThemeContext'
function App() {
  type viewState = 'new' | 'generating' | 'result';

  interface AppState {
    view: viewState;
  }

type  AppAction =
  | { type:'startGeneration' }
  | { type:'finishGeneration' }
  | { type:'newEstimation' }

  function appReducer(state: AppState, action: AppAction): AppState {
    switch(action.type) {
      case 'startGeneration':
        return {...state, view: 'generating' };
      case 'finishGeneration':
        return {...state, view: 'result' };
      case 'newEstimation':
        return { view: 'new' };
      default:
        return state;
    }
  }

  const [state, dispatch] =  useReducer(appReducer, { view: 'new' });

  return (
    <>
    <ThemeProvider>
      <div className='min-h-screen font-sans pb-20 selection:bg-indigo-200 selcetion:text-indigo-900 dark:selection:bg-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300'>

       <NavBar view={state.view} dispatch={dispatch} />

       <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
        {state.view === 'new' && (
         <div className='animate-fade-in mb-10'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight'>
               Draft BOQs , <span className='text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400'>Instantly</span>.
            </h2>
            <p className='text-lg text-slate-500 dark:text-slate-400'>  AI estimation with automated rate analysis, vendor recommendations, and detailed quantity take-offs.</p>
          </div>
         </div>
        )}
       

       </main>
       
      </div>
      </ThemeProvider>
    </>
  )
}

export default App
