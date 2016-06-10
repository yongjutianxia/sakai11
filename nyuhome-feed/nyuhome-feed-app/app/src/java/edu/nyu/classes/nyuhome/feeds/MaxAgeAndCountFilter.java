package edu.nyu.classes.nyuhome.feeds;

import java.util.Date;


class MaxAgeAndCountFilter {
    private Date expireDate;
    private int resultsSeen;
    private int maxResults;

    public MaxAgeAndCountFilter(int maxAgeDays, int maxResults) {
        this.resultsSeen = 0;
        this.maxResults = maxResults;

        expireDate = new Date(new Date().getTime() - ((long)maxAgeDays * 24 * 60 * 60 * 1000));
    }

    public boolean accept(Date entryDate) {
        if (resultsSeen >= maxResults) {
            return false;
        } else {
            resultsSeen++;
        }

        return entryDate.after(expireDate);
    }
}

