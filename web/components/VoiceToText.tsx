'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/Button'
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  FileText
} from 'lucide-react'

interface VoiceToTextProps {
  onTranscriptionComplete: (text: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function VoiceToText({
  onTranscriptionComplete,
  placeholder = 'Click record to start voice input...',
  disabled = false,
  className = ''
}: VoiceToTextProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [volume, setVolume] = useState(0)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'
      
      recognition.onstart = () => {
        setIsRecording(true)
        setIsProcessing(false)
        startTimer()
        startVolumeMonitoring()
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript + interimTranscript)
      }

      recognition.onerror = (event) => {
        setIsRecording(false)
        setIsProcessing(false)
        stopTimer()
        stopVolumeMonitoring()
      }

      recognition.onend = () => {
        setIsRecording(false)
        setIsProcessing(false)
        stopTimer()
        stopVolumeMonitoring()
        
        if (transcript.trim()) {
          onTranscriptionComplete(transcript.trim())
        }
      }

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      stopTimer()
      stopVolumeMonitoring()
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [transcript, onTranscriptionComplete])

  const startTimer = () => {
    setRecordingTime(0)
    intervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)
  }

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setRecordingTime(0)
  }

  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      
      analyser.fftSize = 256
      microphone.connect(analyser)
      
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length
        setVolume(avg)
      }, 100)
    } catch (error) {
      // Volume monitoring is optional
    }
  }

  const stopVolumeMonitoring = () => {
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current)
      volumeIntervalRef.current = null
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }
    
    setVolume(0)
  }

  const startRecording = async () => {
    if (!recognitionRef.current || disabled) return

    try {
      setTranscript('')
      recognitionRef.current.start()
    } catch (error) {
      // Handle error
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
    }
  }

  const pauseRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsPaused(true)
    }
  }

  const resumeRecording = () => {
    if (recognitionRef.current && isPaused) {
      recognitionRef.current.start()
      setIsPaused(false)
    }
  }

  const clearTranscript = () => {
    setTranscript('')
    setRecordingTime(0)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isSupported) {
    return (
      <div className={`p-4 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex items-center gap-2 text-gray-600">
          <MicOff className="h-5 w-5" />
          <span className="text-sm">Voice input not supported in this browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Controls */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isRecording ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600">Recording</span>
                <span className="text-sm text-gray-500">{formatTime(recordingTime)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Ready to record</span>
              </div>
            )}
          </div>

          {/* Volume Indicator */}
          {isRecording && (
            <div className="flex items-center gap-2">
              {volume > 10 ? (
                <Volume2 className="h-4 w-4 text-green-500" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${Math.min(volume * 2, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isRecording && !isPaused && (
            <Button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              variant="construction-primary"
              size="lg"
              className="flex-1"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && !isPaused && (
            <>
              <Button
                onClick={pauseRecording}
                variant="outline"
                size="lg"
              >
                <Pause className="h-5 w-5" />
              </Button>
              <Button
                onClick={stopRecording}
                variant="construction-danger"
                size="lg"
                className="flex-1"
              >
                <Square className="h-5 w-5 mr-2" />
                Stop Recording
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                onClick={resumeRecording}
                variant="construction-primary"
                size="lg"
                className="flex-1"
              >
                <Play className="h-5 w-5 mr-2" />
                Resume
              </Button>
              <Button
                onClick={stopRecording}
                variant="construction-danger"
                size="lg"
              >
                <Square className="h-5 w-5" />
              </Button>
            </>
          )}

          {transcript && !isRecording && (
            <Button
              onClick={clearTranscript}
              variant="outline"
              size="lg"
            >
              <RefreshCw className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Transcript Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[120px]">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Transcript</span>
        </div>
        
        {transcript ? (
          <div className="text-sm text-gray-900 leading-relaxed">
            {transcript}
            {isRecording && <span className="animate-pulse">|</span>}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            {isRecording ? 'Listening...' : placeholder}
          </div>
        )}
      </div>

      {/* Usage Tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Tips for better recognition:</strong></p>
        <ul className="ml-4 space-y-1">
          <li>• Speak clearly and at normal pace</li>
          <li>• Use industry terms like "beam", "weld", "crane", "safety"</li>
          <li>• Pause briefly between sentences</li>
          <li>• Minimize background noise</li>
        </ul>
      </div>
    </div>
  )
}