import PracticeScheduling from '../components/PracticeScheduling.jsx'
import { useAppData } from '../hooks/useAppData.js'
import { useAuth } from '../hooks/useAuth.js'

export default function PracticePage() {
  const { events, teamMembers, practiceData, updatePracticeAvailability, rsvpData } = useAppData()
  const { currentUser } = useAuth()

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