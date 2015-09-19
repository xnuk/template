window.onload=()=>{
	const linkStyle=document.querySelector('link[href="./index.css"]')
	const style=document.createElement('style')
	style.textContent=[...linkStyle.sheet.cssRules].map(v=>v.cssText).join('\n')
	linkStyle.remove()
	document.head.appendChild(style)

	const ws=new WebSocket('wss://localhost:8080', 'xnuk-protocol')
	ws.onmessage=({data: d})=>{
		if(d===' reload'){
			ws.close()
			location.reload()
			return
		}
		style.textContent=d
	}
}