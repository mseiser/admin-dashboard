import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import ReminderForm from '@/components/ui/reminders/reminder-form';
import { ReminderService } from 'services/ReminderService';

type Params = Promise<{
      id: string
}>;

export default async function RemindersEditPage({ params }: {params: Params}) {
    const reminderEditParams = await params;
    const reminderId = reminderEditParams.id;

    const reminder = await ReminderService.getInstance().getSingleWithChildReminders(reminderId as string) || undefined;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Edit reminder</CardTitle>
            </CardHeader>
            <CardContent>
                <ReminderForm reminder={reminder} />
            </CardContent>
        </Card>
    );
}
