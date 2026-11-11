import React, {useEffect, useId, useRef, useState} from 'react';
import {loadLocalities, searchLocalities} from './localities';

export default function LocalityField({initialId = '', initialLabel = '', onSelect, label = 'Localidad y provincia'}) {
  const id = useId(), input = useRef(null);
  const [rows, setRows] = useState([]), [query, setQuery] = useState(initialLabel);
  const [selected, setSelected] = useState(null), [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1), [error, setError] = useState(''), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true; setLoading(true); setError('');
    loadLocalities().then(data => {if (!alive) return; setRows(data); const match = data.find(row => row.id === initialId); if (match) {setSelected(match); setQuery(match.label);}})
      .catch(() => {if (alive) setError('No pudimos cargar las localidades. Revisá tu conexión y volvé a intentar.');})
      .finally(() => {if (alive) setLoading(false);});
    return () => {alive = false;};
  }, [initialId, retry]);
  useEffect(() => {input.current?.setCustomValidity(selected ? '' : 'Elegí una localidad de la lista para continuar.');}, [selected]);
  const results = searchLocalities(rows, query);
  function choose(row) {setSelected(row); onSelect?.(row); setQuery(row.label); setOpen(false); setActive(-1);}
  return <div className="locality-field">
    <label htmlFor={id}>{label}</label>
    <input ref={input} id={id} role="combobox" aria-autocomplete="list" aria-expanded={open && !selected} aria-controls={`${id}-list`} aria-activedescendant={active >= 0 && results[active] ? `${id}-${results[active].id}` : undefined} aria-describedby={`${id}-hint`} autoComplete="off" placeholder="Por ejemplo: Pilar, Buenos Aires" required maxLength={180} value={query}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onChange={event => {setQuery(event.target.value); setSelected(null); setOpen(true); setActive(-1);}}
      onKeyDown={event => {
        if (event.key === 'Escape' && open) {event.stopPropagation(); setOpen(false);}
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault(); setOpen(true); setActive(index => results.length ? (index + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length : -1);}
        if (event.key === 'Enter' && open && !selected) {event.preventDefault(); if (results[active]) choose(results[active]);}
      }}/>
    <input type="hidden" name="locality_id" value={selected?.id || ''}/>
    <input type="hidden" name="area" value={selected?.label || ''}/>
    <small id={`${id}-hint`}>{selected ? 'Localidad seleccionada. No compartís tu dirección exacta.' : initialLabel && !initialId ? 'Confirmá tu zona eligiendo una opción de la lista.' : 'Escribí y elegí una opción. Podés agregar la provincia para afinar la búsqueda.'}</small>
    {loading && <p role="status">Cargando localidades…</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" className="outline" onClick={() => setRetry(value => value + 1)}>Reintentar</button></div>}
    {open && !selected && query.trim() && !loading && !error && <><ul id={`${id}-list`} role="listbox" className="locality-options" aria-label="Localidades argentinas">{results.map((row,index) => <li role="option" aria-selected={active === index} id={`${id}-${row.id}`} key={row.id} onMouseDown={event => event.preventDefault()} onClick={() => choose(row)}><strong>{row.name}, {row.province}</strong><small>{row.department}</small></li>)}</ul><p className="locality-result" role="status">{results.length ? `${results.length} opciones. Si no ves la tuya, escribí más letras o la provincia.` : 'No encontramos esa localidad. Probá con el nombre de la ciudad o localidad, sin calle ni altura.'}</p></>}
  </div>;
}
