(function(){"use strict";self.addEventListener("message",async F=>{const{config:l,part:G,num:R}=F.data;let H=86400-l.sleepTime*3600,E=H/(l.checkFreq-1),d=[],Q=l.genkiSimulation.pickupRate*.01,A=new Array(26).fill(0).map((n,e)=>e*.01),N=new Array(21).fill(0).map((n,e)=>e*200+2e3),T=new Array(15).fill(0).map((n,e)=>e*2+2),b=new Array(7).fill(0).map((n,e)=>e*5+10),u=0,z=A.length*N.length*T.length*b.length;for(let n of A)for(let e of N){let D=Math.ceil(144e3/e);for(let M of T)for(let x of b){let L=function(){for(;a.length<5;){let s=a.length?a.at(-1):g,k=t-Math.max(s-i,0)/600,v=k>80?e*.45:k>60?e*.52:k>40?e*.58:k>0?e*.66:e;a.push(s+v)}o=a[0]},q=function(){a=[],L()};if(u++,u%R||(u%10==0&&postMessage({status:"progress",body:u/z}),Math.random()>=Q))continue;let S=0,w=0,C=0,t=100,f=!1,h=0,r=0,m=0,i=0,p=0,c=0,o=0,g=0,y=86400,a=[];for(;i<86400*(l.genkiSimulation.loopNum+1);){let s=Math.max(Math.min(c,o,y),i);t=Math.max(t-(s-i)/600,0),i=s,y<=i&&(t=Math.min(100,t+Math.floor(l.sleepTime*100/8.5)),q(),p++,y=(p+1)*86400,o=Math.max(g+(t>80?e*.45:t>60?e*.52:t>40?e*.58:t>0?e*.66:e),i)),c<=i&&(r>=x&&q(),r=0,f&&(t=Math.min(t+M,150),f=!1,p&&(S+=M,m%l.checkFreq)),m++,m%l.checkFreq?c+=E:c=m/l.checkFreq*86400),o<=i&&(g=i,a.length&&(a.shift(),f||(Math.random()<n?(f=!0,h=0):(h++,h>=D&&(f=!0,h=0))),r++,r<x&&L()),p&&(i%86400<H?w++:C++),o=a.length?a[0]:g+(t>80?e*.45:t>60?e*.52:t>40?e*.58:t>0?e*.66:e))}d.push({p:n,speed:e,effect:M,bagSize:x,totalEffect:S/l.genkiSimulation.loopNum,dayHelpRate:w/l.genkiSimulation.loopNum/((24-l.sleepTime)*3600/e),nightHelpRate:C/l.genkiSimulation.loopNum/(l.sleepTime*3600/e)})}}return postMessage({status:"success",body:d}),d})})();