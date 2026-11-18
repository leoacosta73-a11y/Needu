// No page or authenticated API caching. Push contains no conversation data.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('push',event=>{
  event.waitUntil(self.registration.showNotification('Needu',{
    body:'Tenés un mensaje nuevo. Abrí Needu para leerlo.',
    icon:'/icon-192.png',badge:'/icon-192.png',tag:'needu-messages',
    data:{url:'/?view=messages'},renotify:true
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(client=>new URL(client.url).origin===self.location.origin&&!new URL(client.url).searchParams.has('demo'));
    if(existing){await existing.focus();existing.postMessage({type:'OPEN_NEEDU_MESSAGES'});}
    else await self.clients.openWindow('/?view=messages');
  })());
});
