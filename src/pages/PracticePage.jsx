import PracticeScheduling from '../components/PracticeScheduling.jsx'
import { useAppDataContext } from '../contexts/AppDataContext.jsx'
import { useAuthContext } from '../contexts/AuthContext.jsx'

export default function PracticePage() {
  const { events, teamMembers, practiceData, updatePracticeAvailability, rsvpData } = useAppDataContext()
  const { currentUser } = useAuthContext()

  return (
    <div className="view active">
      <PracticeScheduling
        events={events}
        currentUser={currentUser}
        teamMembers={teamMembers}
        practiceData={practiceData}
        updatePracticeAvailability={updatePracticeAvailability}
        rsvpData={rsvpData}
      />
    </div>
  )
}