package edu.nyu.classes.groupersync.api;

public class GroupInfo {

    private final GroupStatus status;
    private final String label;
    private final String grouperId;
    private final String sakaiId;
    private final boolean readyForUse;
    private final long lastSyncTime;

    public GroupInfo() {
        // Null object
        this(GroupStatus.AVAILABLE_FOR_SYNC, "", null, null, false, 0);
    }

    public GroupInfo(String label, String grouperId, String sakaiId, boolean readyForUse, long lastSyncTime) {
        this(GroupStatus.MARKED_FOR_SYNC, label, grouperId, sakaiId, readyForUse, lastSyncTime);
    }

    private GroupInfo(GroupStatus status, String label, String grouperId, String sakaiId, boolean readyForUse, long lastSyncTime) {
        this.status = status;
        this.label = label;
        this.grouperId = grouperId;
        this.sakaiId = sakaiId;
        this.readyForUse = readyForUse;
        this.lastSyncTime = lastSyncTime;
    }

    public static GroupInfo unknown() {
        return new GroupInfo(GroupStatus.UNKNOWN, "", null, null, false, 0);
    }

    public String getGrouperId() {
        return grouperId;
    }

    public String getSakaiId() {
        return sakaiId;
    }

    public GroupStatus getStatus() {
        return status;
    }

    public String getLabel() {
        return label;
    }

    public boolean isReadyForUse() {
        return readyForUse;
    }

    public String getLastSyncLabel() {
        return formatDuration(System.currentTimeMillis() - this.lastSyncTime);
    }

    static String formatDuration(long msDuration) {
        String[] units = new String[] {"day", "hour", "minute", "second"};
        long[] secondsPerUnit = new long[] { (24 * 60 * 60), (60 * 60), 60, 1 };

        long seconds = msDuration / 1000;
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < units.length; i++) {
            long unitCount = seconds / secondsPerUnit[i];
            seconds -= unitCount * secondsPerUnit[i];

            if (unitCount > 0) {
                if (sb.length() > 0) {
                    sb.append(", ");
                }

                sb.append(unitCount);
                sb.append(" ");
                sb.append(units[i]);

                // plural
                if (unitCount > 1) {
                    sb.append("s");
                }
            }
        }

        return sb.toString();
    }

    public enum GroupStatus {
        AVAILABLE_FOR_SYNC("Inactive"),
        MARKED_FOR_SYNC("Active"),
        UNKNOWN("Unknown");

        private final String label;

        GroupStatus(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }
}
