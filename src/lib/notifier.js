export function _ensureContainer(){
  let c = document.getElementById('transvera-toasts')
  if (!c){
    c = document.createElement('div')
    c.id = 'transvera-toasts'
    c.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2'
    document.body.appendChild(c)
  }
  return c
}

function makeToast(message, type='info', timeout=4000){
  const c = _ensureContainer()
  const el = document.createElement('div')
  el.className = 'max-w-sm rounded shadow px-4 py-2 text-sm font-medium text-white'
  el.style.opacity = '0'
  el.style.transition = 'opacity 150ms ease, transform 180ms cubic-bezier(.2,.8,.2,1)'
  el.style.transform = 'translateY(-6px)'
  if (type === 'success') el.style.background = '#16a34a'
  else if (type === 'error') el.style.background = '#dc2626'
  else el.style.background = '#334155'
  el.textContent = message
  c.appendChild(el)
  // enter
  requestAnimationFrame(()=>{
    el.style.opacity = '1'
    el.style.transform = 'translateY(0)'
  })
  const tid = setTimeout(()=>{
    // exit
    el.style.opacity = '0'
    el.style.transform = 'translateY(-6px)'
    setTimeout(()=>{ el.remove() }, 180)
  }, timeout)
  return ()=>{ clearTimeout(tid); el.remove() }
}

export function notifySuccess(msg){
  return makeToast(msg, 'success')
}
export function notifyError(msg){
  return makeToast(msg, 'error')
}
export function notifyInfo(msg){
  return makeToast(msg, 'info')
}
