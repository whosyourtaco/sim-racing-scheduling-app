import TeamView from '../components/TeamView.jsx'
import { useAppData } from '../hooks/useAppData.js'
import { useAuth } from '../hooks/useAuth.js'

export default function TeamPage() {
  const { events, teamMembers, rsvpData } = useAppData()
  const { currentUser } = useAuth()

  return (
    <div className="view active">
      <TeamView
        events={events}
        teamMembers={teamMembers}
        rsvpData={rsvpData}
        currentUser={currentUser}
      />
    </div>
  )
}