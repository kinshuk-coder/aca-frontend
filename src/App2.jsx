import { useState, useRef, useEffect } from 'react';
import { Send, Terminal, FileCode, Bot, User, ChevronDown, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

// --- HELPER COMPONENT: Collapsible Expander ---
const Expander = ({ title, icon: Icon, children, defaultOpen = false, type = 'default' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const bgColors = {
    default: 'bg-gray-100 border-gray-200 text-gray-800',
    action: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  return (
    <div className={`my-2 rounded-lg border overflow-hidden transition-colors ${bgColors[type]}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-sm font-medium hover:opacity-80 transition-opacity focus:outline-none"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} />}
          <span>{title}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="p-3 border-t bg-white/50 border-inherit overflow-x-auto text-sm">
          {children}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', type: 'text', content: userMsg }]);
    setIsStreaming(true);

    try {
      // Connect to your FastAPI backend
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });

      if (!response.ok) throw new Error('Failed to connect to the backend API');

      // Set up the stream reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Parse the SSE chunks (split by double newline)
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // Keep the last incomplete chunk in the buffer

        for (const part of parts) {
          if (part.startsWith('data: ')) {
            const dataStr = part.replace('data: ', '').trim();
            
            if (dataStr === '[DONE]') {
              setIsStreaming(false);
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              
              // Append the new streamed event to our message UI state
              setMessages(prev => [...prev, {
                id: Math.random().toString(36).substring(7),
                role: 'assistant',
                type: data.type,
                content: data.content,
                name: data.name
              }]);
            } catch (err) {
              console.error('Error parsing SSE data:', err, dataStr);
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now(), role: 'assistant', type: 'error', content: error.message 
      }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-tight">Autonomous Coding Agent</h1>
            <p className="text-xs text-gray-500 font-medium">React + FastAPI Decoupled Architecture</p>
          </div>
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-sm font-medium animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <span>Agent is working...</span>
          </div>
        )}
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-4xl mx-auto flex flex-col gap-6">
        
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
            <Bot size={48} className="opacity-20" />
            <p className="text-lg">What would you like the agent to build?</p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            
            {/* Avatar */}
            <div className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Message Body */}
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              
              {/* User Text */}
              {msg.role === 'user' && (
                <div className="bg-gray-800 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              )}

              {/* AI Conversational Text */}
              {msg.role === 'assistant' && msg.type === 'message' && (
                <div className="bg-white border text-gray-800 px-5 py-3 rounded-2xl rounded-tl-sm shadow-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              )}

              {/* AI Action (Tool Execution Decision) */}
              {msg.role === 'assistant' && msg.type === 'action' && msg.content.map((tool, idx) => (
                <div key={idx} className="w-full">
                  {tool.name === 'write_file' ? (
                    <Expander title={`Writing File: ${tool.args.file_path}`} icon={FileCode} type="action">
                      <pre className="font-mono text-xs whitespace-pre-wrap text-gray-700 bg-white p-3 rounded border">
                        {tool.args.content}
                      </pre>
                    </Expander>
                  ) : tool.name === 'run_terminal' ? (
                    <Expander title="Executing Terminal Command" icon={Terminal} type="action">
                      <code className="font-mono text-xs font-semibold text-pink-600">
                        $ {tool.args.command}
                      </code>
                    </Expander>
                  ) : (
                    <Expander title={`Action: ${tool.name}`} icon={Bot} type="action">
                      <pre className="text-xs">{JSON.stringify(tool.args, null, 2)}</pre>
                    </Expander>
                  )}
                </div>
              ))}

              {/* AI Tool Result (Terminal output / Success message) */}
              {msg.role === 'assistant' && msg.type === 'tool_result' && (
                <div className="w-full">
                   <Expander 
                    title={`Result: ${msg.name}`} 
                    icon={Terminal} 
                    type={msg.content.includes('SUCCESS') ? 'success' : 'default'}
                   >
                    <pre className="font-mono text-xs whitespace-pre-wrap text-gray-800">
                      {msg.content}
                    </pre>
                  </Expander>
                </div>
              )}

              {/* AI Error */}
              {msg.role === 'assistant' && msg.type === 'error' && (
                <Expander title="System Error" icon={AlertCircle} type="error" defaultOpen={true}>
                  <p className="text-sm font-mono text-red-600">{msg.content}</p>
                </Expander>
              )}

            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t p-4 flex justify-center">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder={isStreaming ? "Agent is typing..." : "Ask the agent to write a script, debug code, or fetch data..."}
            className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all rounded-xl py-4 pl-6 pr-14 outline-none disabled:opacity-60 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-lg transition-colors flex items-center justify-center shadow-sm"
          >
            <Send size={18} className={input.trim() && !isStreaming ? "ml-1" : ""} />
          </button>
        </form>
      </footer>
    </div>
  );
}