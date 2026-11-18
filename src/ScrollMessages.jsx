import React,{useEffect,useRef} from 'react';
export default function ScrollMessages({conversationId,children}){
 const pane=useRef(null),pinned=useRef(true);
 useEffect(()=>{pinned.current=true},[conversationId]);
 useEffect(()=>{if(pinned.current&&pane.current)pane.current.scrollTop=pane.current.scrollHeight},[children,conversationId]);
 return <div ref={pane} className="messages" role="log" aria-label="Conversación" onScroll={()=>{const el=pane.current;pinned.current=el.scrollHeight-el.scrollTop-el.clientHeight<70}}>{children}</div>;
}
