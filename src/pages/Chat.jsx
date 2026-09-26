import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiUser, FiSend } from "react-icons/fi";
import PageHeader from "../components/PageHeader";
import { useMesh } from "../data/MeshProvider";

export default function Chat() {
  const { channels, messages, nodes, boundId, user, sendMessage, refresh } = useMesh();
  const [mode, setMode] = useState("channel");
  const [selection, setSelection] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const choices = mode === "channel" ? channels : nodes.filter((node) => node.id !== boundId);
  const selected = choices.some((item) => item.id === selection) ? selection : choices[0]?.id || "";
  const conversation = messages.filter((message) => mode === "channel"
    ? message.channel_id === selected
    : !message.channel_id && ((message.sender_node_id === boundId && message.recipient_node_id === selected && message.user_id === user.id) || (message.sender_node_id === selected && message.recipient_node_id === boundId)));

  const submit = async (event) => {
    event.preventDefault();
    if (!body.trim() || !selected || sending) return;
    setSending(true); setError("");
    try {
      await sendMessage({ body, channelId: mode === "channel" ? selected : null, recipientId: mode === "direct" ? selected : null });
      setBody("");
    } catch (failure) { setError(failure.message); }
    finally { setSending(false); }
  };
  return <main className="min-h-screen bg-black text-white"><div className="mx-auto max-w-[880px] px-5 pb-32">
    <PageHeader title="Messages" rightContent={<button onClick={refresh} className="text-sm text-blue-300">Refresh</button>} />
    <div className="mt-5 grid grid-cols-2 gap-2">{[["channel", "Channels", FiUsers], ["direct", "Direct messages", FiUser]].map(([value, label, Icon]) => <button key={value} onClick={() => { setMode(value); setSelection(""); setBody(""); setError(""); }} aria-pressed={mode === value} className={`flex items-center justify-center gap-2 rounded-2xl p-3 text-sm ${mode === value ? "bg-blue-400/15 text-blue-300" : "bg-white/5 text-white/60"}`}><Icon />{label}</button>)}</div>
    <label className="mt-5 block text-xs text-white/50">{mode === "channel" ? "Channel" : "Recipient"}
      <select value={selected} onChange={(event) => { setSelection(event.target.value); setBody(""); }} className="mt-2 w-full rounded-xl border border-white/10 bg-[#1c1c1e] p-3 text-sm text-white" disabled={sending || !choices.length}>
        {!choices.length && <option value="">None available</option>}
        {choices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <p className="mt-3 text-xs text-white/40">Messages are saved online. LoRa transmission is not connected yet.</p>
    <section aria-label="Conversation" className="my-5 min-h-[220px] space-y-3">
      {conversation.map((message) => <article key={message.id} className={`w-fit max-w-[90%] rounded-2xl border p-4 ${message.sender_node_id === boundId ? "mr-auto border-emerald-400/20 bg-emerald-500/20 text-emerald-50" : "ml-auto border-white/10 bg-white/5"}`}>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-white/40"><span>{nodes.find((node) => node.id === message.sender_node_id)?.name || message.sender_node_id}</span><time dateTime={message.sent_at}>{new Date(message.sent_at).toLocaleString()}</time></div>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{message.body}</p>
      </article>)}
      {!conversation.length && <p className="py-16 text-center text-sm text-white/40">No messages in this conversation.</p>}
    </section>
    {!boundId && <p className="mb-3 text-sm text-white/60"><Link to="/connect" className="text-blue-300">Connect a device</Link> to send messages.</p>}
    {error && <p role="alert" className="mb-3 text-sm text-red-300">{error}</p>}
    <form onSubmit={submit} className="flex gap-2">
      <textarea aria-label="Message" maxLength={1000} value={body} onChange={(event) => setBody(event.target.value)} disabled={sending || !boundId || !selected} placeholder="Write a message..." rows={2} className="min-w-0 flex-1 resize-none rounded-2xl border border-white/15 bg-white/5 p-3 text-sm" />
      <button aria-label="Send message" disabled={sending || !boundId || !selected || !body.trim()} className="grid w-12 place-items-center rounded-2xl bg-blue-400 text-black disabled:opacity-30"><FiSend size={20} /></button>
    </form>
  </div></main>;
}
