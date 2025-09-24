import TeamView from '../components/TeamView.jsx'
import { useAppDataContext } from '../contexts/AppDataContext.jsx'
import { useAuthContext } from '../contexts/AuthContext.jsx'

export default function TeamPage() {
  const { events, teamMembers, rsvpData } = useAppDataContext()
  const { currentUser } = useAuthContext()

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