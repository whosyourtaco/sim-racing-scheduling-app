import CalendarView from '../components/CalendarView.jsx'
import { useAppDataContext } from '../contexts/AppDataContext.jsx'
import { useAuthContext } from '../contexts/AuthContext.jsx'

export default function CalendarPage({ openEventModal }) {
  const { events, rsvpData, teamMembers } = useAppDataContext()
  const { isAuthenticated, currentUser } = useAuthContext()

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