import CalendarView from '../components/CalendarView.jsx'
import { useAppData } from '../hooks/useAppData.js'
import { useAuth } from '../hooks/useAuth.js'

export default function CalendarPage({ openEventModal }) {
  const { events, rsvpData, teamMembers } = useAppData()
  const { isAuthenticated, currentUser } = useAuth()

  return (
    <div className="view active">
      <CalendarView
        events={events}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        rsvpData={rsvpData}
        teamMembers={teamMembers}
        openEventModal={openEventModal}
      />
    </div>
  )
}