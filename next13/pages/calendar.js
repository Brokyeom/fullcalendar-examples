import Layout from '@/components/layout'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimegridPlugin from '@fullcalendar/resource-timegrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'

// 투자사 더미 데이터 (개별 블록 시간 포함)
const INVESTORS = [
  {
    id: 'investor-a',
    title: '투자사 A',
    eventColor: 'blue',
    description: 'AI/ML 전문 투자사',
    logo: '🚀',
    blockedTimes: [
      { start: '11:00', end: '11:30', reason: '내부 회의' },
      { start: '15:30', end: '16:30', reason: '기술 검토 시간' },
    ],
  },
  {
    id: 'investor-b',
    title: '투자사 B',
    eventColor: 'green',
    description: '핀테크 전문 투자사',
    logo: '💰',
    blockedTimes: [
      { start: '10:30', end: '11:00', reason: '파트너 콜' },
      { start: '14:00', end: '14:30', reason: '투자위원회' },
      { start: '16:00', end: '17:00', reason: '실사 검토' },
    ],
  },
  {
    id: 'investor-c',
    title: '투자사 C',
    eventColor: 'purple',
    description: '헬스케어 전문 투자사',
    logo: '🏥',
    blockedTimes: [
      { start: '10:00', end: '10:30', reason: '의료진 상담' },
      { start: '13:30', end: '14:00', reason: '규제 검토' },
      { start: '15:00', end: '15:30', reason: '임상 데이터 분석' },
    ],
  },
]

// 1:1 미팅 더미 데이터 (수신자 <> 발신자 형식)
const MEETINGS = [
  {
    id: 'meeting-1',
    title: '투자사 A 파트너 <> CEO',
    start: '2025-09-16T10:30:00',
    end: '2025-09-16T11:00:00',
    resourceId: 'investor-a',
    extendedProps: {
      type: '사업계획 프레젠테이션',
      receiver: '투자사 A 파트너',
      sender: 'CEO',
      status: 'confirmed',
    },
  },
  {
    id: 'meeting-2',
    title: '투자사 B 심사역 <> CFO',
    start: '2025-09-17T14:00:00',
    end: '2025-09-17T14:30:00',
    resourceId: 'investor-b',
    extendedProps: {
      type: '투자조건 협상',
      receiver: '투자사 B 심사역',
      sender: 'CFO',
      status: 'pending',
    },
  },
  {
    id: 'meeting-3',
    title: '투자사 C CTO <> CTO',
    start: '2025-09-18T14:30:00',
    end: '2025-09-18T15:00:00',
    resourceId: 'investor-c',
    extendedProps: {
      type: '기술 검토',
      receiver: '투자사 C CTO',
      sender: 'CTO',
      status: 'confirmed',
    },
  },
  {
    id: 'meeting-4',
    title: '투자사 A MD <> CEO',
    start: '2025-09-16T14:30:00',
    end: '2025-09-16T15:00:00',
    resourceId: 'investor-a',
    extendedProps: {
      type: '후속 투자 논의',
      receiver: '투자사 A MD',
      sender: 'CEO',
      status: 'tentative',
    },
  },
  {
    id: 'meeting-5',
    title: '투자사 B 법무팀장 <> 법무담당자',
    start: '2025-09-17T11:00:00',
    end: '2025-09-17T11:30:00',
    resourceId: 'investor-b',
    extendedProps: {
      type: '실사 준비',
      receiver: '투자사 B 법무팀장',
      sender: '법무담당자',
      status: 'confirmed',
    },
  },
  {
    id: 'meeting-6',
    title: '투자사 C 애널리스트 <> 마케팅팀장',
    start: '2025-09-18T11:00:00',
    end: '2025-09-18T11:30:00',
    resourceId: 'investor-c',
    extendedProps: {
      type: '시장분석 리뷰',
      receiver: '투자사 C 애널리스트',
      sender: '마케팅팀장',
      status: 'confirmed',
    },
  },
  {
    id: 'meeting-7',
    title: '투자사 A VP <> BD팀장',
    start: '2025-09-17T15:30:00',
    end: '2025-09-17T16:00:00',
    resourceId: 'investor-a',
    extendedProps: {
      type: '파트너십 검토',
      receiver: '투자사 A VP',
      sender: 'BD팀장',
      status: 'pending',
    },
  },
  {
    id: 'meeting-8',
    title: '투자사 B 대표 <> CEO',
    start: '2025-09-16T16:30:00',
    end: '2025-09-16T17:00:00',
    resourceId: 'investor-b',
    extendedProps: {
      type: '최종 의사결정',
      receiver: '투자사 B 대표',
      sender: 'CEO',
      status: 'confirmed',
    },
  },
]

export default function CalendarPage() {
  // 필터 상태 관리
  const [selectedInvestors, setSelectedInvestors] = useState(
    INVESTORS.map((investor) => investor.id) // 초기값: 모든 투자사 선택
  )

  // 사용자 안내 메시지 상태
  const [guidanceMessage, setGuidanceMessage] = useState('')
  const [showGuidance, setShowGuidance] = useState(false)
  
  // 미팅 상세 팝업 상태
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 })
  const [showPopup, setShowPopup] = useState(false)
  const [portalContainer, setPortalContainer] = useState(null)

  // 포털 컨테이너 설정 및 키보드 이벤트 리스너
  useEffect(() => {
    // 포털 컨테이너 생성
    if (typeof window !== 'undefined') {
      setPortalContainer(document.body)
    }

    // ESC 키로 팝업 닫기
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showPopup) {
        closeMeetingPopup()
      }
    }

    if (showPopup) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showPopup])

  // 시간 체크 헬퍼 함수들
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const isCommonBlockedTime = (start, end) => {
    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()

    // 점심시간 체크 (12:00-13:30)
    const lunchStart = 12 * 60 // 720분 (12:00)
    const lunchEnd = 13 * 60 + 30 // 810분 (13:30)

    return (
      (startMinutes >= lunchStart && startMinutes < lunchEnd) ||
      (endMinutes > lunchStart && endMinutes <= lunchEnd) ||
      (startMinutes < lunchStart && endMinutes > lunchEnd)
    )
  }

  // 분 단위를 HH:MM 형식으로 변환
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0')
    const mins = (minutes % 60).toString().padStart(2, '0')
    return `${hours}:${mins}`
  }

  const getBlockedTimeReason = (investorId, start, end) => {
    // 공통 점심시간 체크
    if (isCommonBlockedTime(start, end)) {
      return '🍽️ 점심시간(12:00-13:30)'
    }

    // 투자사별 블록시간 체크
    const investor = INVESTORS.find((inv) => inv.id === investorId)
    if (!investor) return null

    const startMinutes = start.getHours() * 60 + start.getMinutes()
    const endMinutes = end.getHours() * 60 + end.getMinutes()

    const blockedTime = investor.blockedTimes.find((blockedTime) => {
      const blockedStart = timeToMinutes(blockedTime.start)
      const blockedEnd = timeToMinutes(blockedTime.end)

      return (
        (startMinutes >= blockedStart && startMinutes < blockedEnd) ||
        (endMinutes > blockedStart && endMinutes <= blockedEnd) ||
        (startMinutes < blockedStart && endMinutes > blockedEnd)
      )
    })

    return blockedTime
      ? `⏰ ${blockedTime.reason} (${blockedTime.start}-${blockedTime.end})`
      : null
  }

  // 필터링된 이벤트와 리소스
  const filteredResources = useMemo(() => {
    return INVESTORS.filter((investor) =>
      selectedInvestors.includes(investor.id)
    )
  }, [selectedInvestors])

  const filteredEvents = useMemo(() => {
    return MEETINGS.filter((meeting) =>
      selectedInvestors.includes(meeting.resourceId)
    )
  }, [selectedInvestors])

  // 투자사별 블록시간을 배경 이벤트로 생성 (점심시간처럼 보이게)
  const backgroundEvents = useMemo(() => {
    const blockEvents = []

    // 공통 점심시간 (모든 투자사 컬럼에 표시)
    filteredResources.forEach((resource) => {
      blockEvents.push({
        id: `lunch-${resource.id}`,
        title: '점심시간',
        start: '2025-09-16T12:00:00',
        end: '2025-09-16T13:30:00',
        resourceId: resource.id,
        display: 'background',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        classNames: ['fc-non-business', 'lunch-block'],
      })
      blockEvents.push({
        id: `lunch-${resource.id}-17`,
        title: '점심시간',
        start: '2025-09-17T12:00:00',
        end: '2025-09-17T13:30:00',
        resourceId: resource.id,
        display: 'background',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        classNames: ['fc-non-business', 'lunch-block'],
      })
      blockEvents.push({
        id: `lunch-${resource.id}-18`,
        title: '점심시간',
        start: '2025-09-18T12:00:00',
        end: '2025-09-18T13:30:00',
        resourceId: resource.id,
        display: 'background',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        classNames: ['fc-non-business', 'lunch-block'],
      })
    })

    // 투자사별 개별 블록시간
    filteredResources.forEach((resource) => {
      resource.blockedTimes.forEach((blockTime, index) => {
        // 9월 16, 17, 18일 각각에 대해 블록시간 추가
        ;['2025-09-16', '2025-09-17', '2025-09-18'].forEach((date) => {
          blockEvents.push({
            id: `block-${resource.id}-${index}-${date}`,
            title: blockTime.reason,
            start: `${date}T${blockTime.start}:00`,
            end: `${date}T${blockTime.end}:00`,
            resourceId: resource.id,
            display: 'background',
            backgroundColor:
              resource.id === 'investor-a'
                ? 'rgba(59, 130, 246, 0.1)'
                : resource.id === 'investor-b'
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(139, 92, 246, 0.1)',
            classNames: [
              'fc-non-business',
              'investor-block',
              `${resource.id}-block`,
            ],
          })
        })
      })
    })

    return blockEvents
  }, [filteredResources])

  // 기본 businessHours (점심시간만 제외)
  const businessHours = [
    {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '12:00',
    },
    {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      startTime: '13:30',
      endTime: '17:00',
    },
  ]

  // 모든 이벤트 합치기 (미팅 + 배경 블록시간)
  const allEvents = useMemo(() => {
    return [...filteredEvents, ...backgroundEvents]
  }, [filteredEvents, backgroundEvents])

  // 투자사 필터 토글 함수
  const toggleInvestor = (investorId) => {
    setSelectedInvestors((prev) => {
      if (prev.includes(investorId)) {
        return prev.filter((id) => id !== investorId)
      } else {
        return [...prev, investorId]
      }
    })
  }

  // 전체 선택/해제 함수
  const toggleAll = () => {
    if (selectedInvestors.length === INVESTORS.length) {
      setSelectedInvestors([]) // 전체 해제
    } else {
      setSelectedInvestors(INVESTORS.map((investor) => investor.id)) // 전체 선택
    }
  }

  // 안내 메시지 표시 함수
  const showGuidanceMessage = (message) => {
    setGuidanceMessage(message)
    setShowGuidance(true)
    setTimeout(() => {
      setShowGuidance(false)
    }, 3000)
  }
  
  // 미팅 상세 팝업 관리
  const openMeetingPopup = (meetingInfo, clickEvent) => {
    const event = meetingInfo.event
    const resource = event.getResources()[0]
    const extendedProps = event.extendedProps || {}
    
    // 이벤트 요소의 정확한 위치 계산 (실제 DOM 요소의 위치)
    const eventElement = clickEvent.el
    const rect = eventElement.getBoundingClientRect()
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    
    // 스크롤 위치 디버깅을 위한 로그
    console.log('Event position:', {
      rect: rect,
      scrollTop: scrollTop,
      scrollLeft: scrollLeft,
      eventBottom: rect.bottom,
      calculatedTop: rect.bottom + scrollTop + 5
    })
    
    // 팝업이 이벤트 블록 근처에 위치하도록 계산
    const popupWidth = 320
    const popupHeight = 450
    
    // 이벤트 블록 바로 아래에 위치하도록 계산 (스크롤 보정 제거)
    let left = rect.left // 이벤트 블록의 왼쪽 정렬 (스크롤 보정 불필요)
    let top = rect.bottom + 5 // 이벤트 블록 바로 아래 5px 간격 (스크롤 보정 불필요)
    
    // 화면 경계 체크
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 오른쪽으로 넘어가면 왼쪽으로 조정
    if (left + popupWidth > viewportWidth - 20) {
      left = Math.max(20, rect.right - popupWidth)
    }
    
    // 아래로 넘어가면 위쪽으로 조정
    if (top + popupHeight > viewportHeight - 20) {
      top = rect.top - popupHeight - 5
    }
    
    // 최소 여백 보장
    left = Math.max(20, left)
    top = Math.max(20, top)
    
    setSelectedMeeting({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      type: extendedProps.type,
      receiver: extendedProps.receiver,
      sender: extendedProps.sender,
      status: extendedProps.status,
      resource: {
        id: resource?.id,
        title: resource?.title,
        logo: resource?.logo,
        description: resource?.description
      }
    })
    
    setPopupPosition({ top, left })
    setShowPopup(true)
  }
  
  const closeMeetingPopup = () => {
    setShowPopup(false)
    setSelectedMeeting(null)
  }
  
  // 매칭 확정/거절 액션
  const handleMeetingAction = (action) => {
    if (!selectedMeeting) return
    
    // 실제로는 서버 API 호출이 필요
    console.log(`미팅 ${action}:`, {
      meetingId: selectedMeeting.id,
      action: action,
      meeting: selectedMeeting
    })
    
    let message = ''
    switch(action) {
      case 'confirm':
        message = `✅ "${selectedMeeting.title}" 미팅이 확정되었습니다`
        break
      case 'reject':
        message = `❌ "${selectedMeeting.title}" 미팅이 거절되었습니다`
        break
      case 'reschedule':
        message = `📅 "${selectedMeeting.title}" 미팅 일정 변경이 요청되었습니다`
        break
    }
    
    showGuidanceMessage(message)
    closeMeetingPopup()
  }
  return (
    <Layout>
      <div className='calendar-container'>
        <div className='mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            투자사 미팅 스케줄러
          </h1>
          <p className='text-gray-600 text-lg mb-4'>
            2025년 9월 16일 - 18일 투자 미팅 일정을 관리하세요
          </p>

          {/* 블록시간 범례 */}
          <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <div
                className='w-4 h-4 bg-red-100 border-2 border-red-200 rounded'
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(239, 68, 68, 0.2) 2px, rgba(239, 68, 68, 0.2) 4px)',
                }}
              ></div>
              <span>공통 점심시간 (12:00-13:30)</span>
            </div>
            <div className='flex items-center gap-2'>
              <div
                className='w-4 h-4 bg-blue-100 border-l-4 border-l-blue-500 rounded'
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(59, 130, 246, 0.2) 2px, rgba(59, 130, 246, 0.2) 4px)',
                }}
              ></div>
              <span>🚀 투자사 A 블록시간</span>
            </div>
            <div className='flex items-center gap-2'>
              <div
                className='w-4 h-4 bg-green-100 border-l-4 border-l-green-500 rounded'
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34, 197, 94, 0.2) 2px, rgba(34, 197, 94, 0.2) 4px)',
                }}
              ></div>
              <span>💰 투자사 B 블록시간</span>
            </div>
            <div className='flex items-center gap-2'>
              <div
                className='w-4 h-4 bg-purple-100 border-l-4 border-l-purple-500 rounded'
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(139, 92, 246, 0.2) 2px, rgba(139, 92, 246, 0.2) 4px)',
                }}
              ></div>
              <span>🏥 투자사 C 블록시간</span>
            </div>
          </div>
        </div>

        {/* 투자사 필터 UI - 컴팩트 버전 */}
        <div className='mb-6'>
          <div className='flex flex-col lg:flex-row lg:items-center gap-4 p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/30 shadow-lg'>
            {/* 헤더 */}
            <div className='flex items-center gap-3 lg:flex-shrink-0'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm'>
                🎯
              </div>
              <div>
                <h2 className='font-bold text-gray-900 text-lg'>투자사 필터</h2>
                <p className='text-xs text-gray-600'>
                  {selectedInvestors.length}/{INVESTORS.length}개 선택 •{' '}
                  {filteredEvents.length}개 1:1 미팅
                </p>
              </div>
            </div>

            {/* 필터 버튼들 */}
            <div className='flex-1 flex flex-wrap gap-3'>
              {INVESTORS.map((investor) => (
                <button
                  key={investor.id}
                  onClick={() => toggleInvestor(investor.id)}
                  title={`블록시간: ${investor.blockedTimes
                    .map((bt) => `${bt.start}-${bt.end} (${bt.reason})`)
                    .join(', ')}`}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5
                    ${
                      selectedInvestors.includes(investor.id)
                        ? 'border-blue-300 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'border-gray-200 bg-white/60 text-gray-700 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                >
                  {/* 로고 */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform group-hover:scale-110
                    ${
                      selectedInvestors.includes(investor.id)
                        ? 'bg-white/20'
                        : 'bg-gray-100'
                    }`}
                  >
                    {investor.logo}
                  </div>

                  {/* 정보 */}
                  <div className='text-left min-w-0'>
                    <div className='font-bold text-sm truncate'>
                      {investor.title}
                    </div>
                    <div
                      className={`text-xs opacity-80 truncate
                      ${
                        selectedInvestors.includes(investor.id)
                          ? 'text-white/80'
                          : 'text-gray-500'
                      }
                    `}
                    >
                      {
                        MEETINGS.filter((m) => m.resourceId === investor.id)
                          .length
                      }
                      개 미팅 • {investor.blockedTimes.length}개 블록시간
                    </div>
                  </div>

                  {/* 선택 표시 */}
                  {selectedInvestors.includes(investor.id) && (
                    <div className='w-5 h-5 bg-white/20 rounded-full flex items-center justify-center ml-2'>
                      <div className='w-2 h-2 bg-white rounded-full animate-pulse'></div>
                    </div>
                  )}

                  {/* 글로우 효과 */}
                  {selectedInvestors.includes(investor.id) && (
                    <div className='absolute inset-0 bg-primary-400/20 rounded-xl blur-xl -z-10 group-hover:bg-primary-400/30 transition-colors'></div>
                  )}
                </button>
              ))}
            </div>

            {/* 액션 버튼들 */}
            <div className='flex gap-2 lg:flex-shrink-0'>
              <button
                onClick={toggleAll}
                className='px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300'
              >
                {selectedInvestors.length === INVESTORS.length
                  ? '전체 해제'
                  : '전체 선택'}
              </button>

              {/* 필터 상태 표시 */}
              <div className='px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-sm font-medium'>
                {filteredEvents.length > 0
                  ? `${filteredEvents.length}개 활성`
                  : '미팅 없음'}
              </div>
            </div>
          </div>

          {/* 빠른 상태 표시 */}
          {selectedInvestors.length === 0 && (
            <div className='mt-3 p-3 bg-warning-50 border border-warning-200 rounded-lg flex items-center gap-2'>
              <span className='text-warning-600'>⚠️</span>
              <span className='text-sm text-warning-700 font-medium'>
                투자사를 선택하여 미팅을 확인하세요
              </span>
            </div>
          )}

          {selectedInvestors.length > 0 && filteredEvents.length === 0 && (
            <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2'>
              <span className='text-blue-600'>ℹ️</span>
              <span className='text-sm text-blue-700 font-medium'>
                선택된 투자사에 예정된 미팅이 없습니다
              </span>
            </div>
          )}
        </div>

        {/* 투자사별 블록시간 상세정보 */}

        {/* 사용자 안내 메시지 */}
        {showGuidance && (
          <div className='fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in'>
            <div className='px-6 py-4 bg-red-500 text-white rounded-2xl shadow-custom-lg border border-red-400/30 backdrop-blur-md'>
              <div className='flex items-center gap-3'>
                <div className='flex-shrink-0'>
                  <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                    {guidanceMessage.includes('⚠️') ? '⚠️' : '🍽️'}
                  </div>
                </div>
                <div>
                  <p className='font-bold text-lg'>
                    {guidanceMessage.replace(/^[⚠️🍽️]\s*/, '')}
                  </p>
                  <p className='text-red-100 text-sm'>
                    업무시간과 점심시간을 확인해주세요
                  </p>
                </div>
              </div>

              {/* 프로그레스 바 */}
              <div className='mt-3 w-full bg-white/20 rounded-full h-1 overflow-hidden'>
                <div className='h-full bg-white rounded-full animate-shrink-width'></div>
              </div>
            </div>
          </div>
        )}
        
        {/* 미팅 상세 팝업 - 구글 캘린더 스타일 (Portal 사용) */}
        {showPopup && selectedMeeting && portalContainer && createPortal(
          <>
            {/* 팝업 배경 오버레이 */}
            <div 
              className='fixed inset-0 bg-black/20 backdrop-blur-sm'
              style={{ zIndex: 9998 }}
              onClick={closeMeetingPopup}
            ></div>
            
            {/* 팝업 컨텐츠 */}
            <div 
              className='fixed w-80 bg-white rounded-xl shadow-2xl border border-gray-200/30 overflow-hidden animate-fade-in'
              style={{
                top: `${popupPosition.top}px`,
                left: `${popupPosition.left}px`,
                maxHeight: '70vh',
                maxWidth: '320px',
                zIndex: 9999
              }}
            >
              {/* 헤더 */}
              <div className={`p-4 bg-gradient-to-r ${
                selectedMeeting.resource?.id === 'investor-a' ? 'from-blue-500 to-blue-600' :
                selectedMeeting.resource?.id === 'investor-b' ? 'from-green-500 to-green-600' :
                'from-purple-500 to-purple-600'
              } text-white relative overflow-hidden`}>
                
                {/* 배경 패턴 */}
                <div className='absolute inset-0 opacity-10'>
                  <div className='absolute inset-0 bg-gradient-to-br from-white/20 to-transparent'></div>
                </div>
                
                <div className='relative z-10'>
                  {/* 상단 바 */}
                  <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center gap-2'>
                      <div className='text-lg'>{selectedMeeting.resource?.logo}</div>
                      <div className='text-xs opacity-90 truncate'>{selectedMeeting.resource?.title}</div>
                    </div>
                    <button 
                      onClick={closeMeetingPopup}
                      className='p-1 rounded-md hover:bg-white/20 transition-colors'
                    >
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 미팅 제목 */}
                  <h3 className='text-lg font-bold mb-2 leading-tight'>{selectedMeeting.title}</h3>
                  
                  {/* 상태 배지 */}
                  <div className='flex flex-wrap items-center gap-1'>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      selectedMeeting.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selectedMeeting.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedMeeting.status === 'confirmed' ? '✅ 확정' :
                       selectedMeeting.status === 'pending' ? '⏳ 대기중' :
                       '📝 미정'}
                    </span>
                    <span className='px-2 py-1 rounded-md text-xs font-medium bg-white/20 text-white truncate'>
                      {selectedMeeting.type}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 미팅 상세정보 */}
              <div className='p-4 space-y-3'>
                {/* 시간 정보 */}
                <div className='flex items-start gap-3'>
                  <div className='w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0'>
                    <svg className='w-3 h-3 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
                    </svg>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-900 text-sm truncate'>
                      {selectedMeeting.start?.toLocaleDateString('ko-KR', { 
                        month: 'long', 
                        day: 'numeric',
                        weekday: 'short'
                      })}
                    </p>
                    <p className='text-gray-600 text-xs'>
                      {selectedMeeting.start?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} - {' '}
                      {selectedMeeting.end?.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      <span className='ml-1 text-xs bg-gray-100 px-1.5 py-0.5 rounded'>
                        {Math.round((selectedMeeting.end - selectedMeeting.start) / (1000 * 60))}분
                      </span>
                    </p>
                  </div>
                </div>
                
                {/* 참석자 정보 */}
                <div className='flex items-start gap-3'>
                  <div className='w-6 h-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0'>
                    <svg className='w-3 h-3 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-900 text-sm'>참석자</p>
                    <div className='space-y-0.5 mt-1'>
                      <div className='flex items-center gap-1.5'>
                        <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                        <span className='text-xs text-gray-700 truncate'>{selectedMeeting.receiver} (수신자)</span>
                      </div>
                      <div className='flex items-center gap-1.5'>
                        <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                        <span className='text-xs text-gray-700 truncate'>{selectedMeeting.sender} (발신자)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 투자사 정보 */}
                <div className='flex items-start gap-3'>
                  <div className='w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0'>
                    <div className='text-xs'>{selectedMeeting.resource?.logo}</div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-gray-900 text-sm truncate'>{selectedMeeting.resource?.title}</p>
                    <p className='text-gray-600 text-xs truncate'>{selectedMeeting.resource?.description}</p>
                  </div>
                </div>
              </div>
              
              {/* 액션 버튼들 */}
              <div className='px-4 py-3 bg-gray-50 border-t border-gray-100'>
                <div className='flex flex-wrap gap-2 justify-end'>
                  {selectedMeeting.status !== 'confirmed' && (
                    <button
                      onClick={() => handleMeetingAction('confirm')}
                      className='flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-medium text-xs'
                    >
                      <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                      </svg>
                      확정
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleMeetingAction('reschedule')}
                    className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium text-xs'
                  >
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
                    </svg>
                    변경
                  </button>
                  
                  <button
                    onClick={() => handleMeetingAction('reject')}
                    className='flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium text-xs'
                  >
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                    거절
                  </button>
                </div>
                
                {/* 추가 액션 */}
                <div className='flex items-center gap-3 mt-2 pt-2 border-t border-gray-200'>
                  <button className='text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1'>
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13' />
                    </svg>
                    첨부파일
                  </button>
                  <button className='text-gray-500 hover:text-gray-700 text-xs flex items-center gap-1'>
                    <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                    </svg>
                    메모
                  </button>
                </div>
              </div>
            </div>
          </>,
          portalContainer
        )}

        <FullCalendar
          plugins={[
            resourceTimegridPlugin,
            dayGridPlugin,
            interactionPlugin,
            timeGridPlugin,
          ]}
          headerToolbar={false}
          views={{
            resourceTimeGridWeek: {
              type: 'resourceTimeGrid',
              duration: { days: 3 },
            },
            resourceTimeGridDay: {
              type: 'resourceTimeGrid',
              duration: { days: 1 },
            },
          }}
          initialView='resourceTimeGridWeek'
          initialDate='2025-09-16'
          validRange={{
            start: '2025-09-16',
            end: '2025-09-19',
          }}
          slotMinTime='10:00:00'
          slotMaxTime='17:00:00'
          scrollTime='10:00:00'
          businessHours={businessHours}
          selectConstraint='businessHours'
          nowIndicator={true}
          editable={true}
          selectable={true}
          selectMirror={true}
          resources={filteredResources}
          events={allEvents}
          eventClick={(info) => {
            // 배경 이벤트(블록시간)는 클릭하지 않도록 필터링
            if (info.event.display === 'background') {
              return
            }
            
            // 미팅 상세 팝업 열기
            openMeetingPopup(info, info)
          }}
          eventMouseEnter={(info) => {
            // 호버 시 상세 툴팁 (1:1 미팅)
            const event = info.event
            const resource = event.getResources()[0]
            const extendedProps = event.extendedProps || {}

            info.el.classList.add('animate-pulse')
            info.el.title = [
              `1:1 미팅: ${event.title}`,
              `투자사: ${resource?.title || '정보 없음'} ${
                resource?.logo || ''
              }`,
              `시간: ${event.start?.toLocaleString(
                'ko-KR'
              )} - ${event.end?.toLocaleString('ko-KR')}`,
              `유형: ${extendedProps.type || '미정'}`,
              `수신자: ${extendedProps.receiver || '알 수 없음'}`,
              `발신자: ${extendedProps.sender || '알 수 없음'}`,
              `상태: ${extendedProps.status || '미정'}`,
            ].join('\n')
          }}
          eventMouseLeave={(info) => {
            info.el.classList.remove('animate-pulse')
          }}
          selectAllow={(selectInfo) => {
            // 업무시간 외 선택 방지
            const startHour = selectInfo.start.getHours()
            const endHour = selectInfo.end.getHours()

            // 10시 이전 또는 17시 이후 방지
            if (startHour < 10 || endHour > 17) {
              showGuidanceMessage(
                '⚠️ 업무시간(10:00-17:00) 내에서만 미팅을 예약할 수 있습니다'
              )
              return false
            }

            // 투자사별 블록시간 체크
            const investorId = selectInfo.resource?.id
            if (investorId) {
              const reason = getBlockedTimeReason(
                investorId,
                selectInfo.start,
                selectInfo.end
              )
              if (reason) {
                showGuidanceMessage(`${reason}에는 미팅을 예약할 수 없습니다`)
                return false
              }
            }

            return true
          }}
          eventAllow={(dropInfo) => {
            // 드래그 앤 드롭 시 업무시간 외 방지
            const startHour = dropInfo.start.getHours()
            const endHour = dropInfo.end.getHours()

            // 10시 이전 또는 17시 이후 방지
            if (startHour < 10 || endHour > 17) {
              showGuidanceMessage(
                '⚠️ 업무시간(10:00-17:00) 내에서만 일정을 이동할 수 있습니다'
              )
              return false
            }

            // 투자사별 블록시간 체크
            const investorId = dropInfo.resource?.id
            if (investorId) {
              const reason = getBlockedTimeReason(
                investorId,
                dropInfo.start,
                dropInfo.end
              )
              if (reason) {
                showGuidanceMessage(`${reason}으로는 일정을 이동할 수 없습니다`)
                return false
              }
            }

            return true
          }}
          eventResize={false}
          eventDurationEditable={false}
          select={(selectInfo) => {
            const investor = INVESTORS.find(
              (inv) => inv.id === selectInfo.resource?.id
            )
            console.log('📅 새 미팅 슬롯 선택:', {
              시작시간: selectInfo.start.toLocaleString('ko-KR'),
              종료시간: selectInfo.end.toLocaleString('ko-KR'),
              선택된투자사: selectInfo.resource?.title || '투자사 없음',
              투자사정보: investor
                ? `${investor.description} ${investor.logo}`
                : '정보 없음',
              기간: `${Math.round(
                (selectInfo.end - selectInfo.start) / (1000 * 60)
              )}분`,
            })
          }}
        />
      </div>
    </Layout>
  )
}
