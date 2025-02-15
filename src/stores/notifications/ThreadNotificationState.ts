/*
Copyright 2021 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { NotificationColor } from "./NotificationColor";
import { IDestroyable } from "../../utils/IDestroyable";
import { MatrixClientPeg } from "../../MatrixClientPeg";
import { MatrixEvent } from "matrix-js-sdk/src/models/event";
import { NotificationState } from "./NotificationState";
import { Thread, ThreadEvent } from "matrix-js-sdk/src/models/thread";
import { Room } from "matrix-js-sdk/src/models/room";

export class ThreadNotificationState extends NotificationState implements IDestroyable {
    protected _symbol = null;
    protected _count = 0;
    protected _color = NotificationColor.None;

    constructor(public readonly room: Room, public readonly thread: Thread) {
        super();
        this.thread.on(ThreadEvent.NewReply, this.handleNewThreadReply);
        this.thread.on(ThreadEvent.ViewThread, this.resetThreadNotification);
    }

    public destroy(): void {
        super.destroy();
        this.thread.off(ThreadEvent.NewReply, this.handleNewThreadReply);
        this.thread.off(ThreadEvent.ViewThread, this.resetThreadNotification);
    }

    private handleNewThreadReply(thread: Thread, event: MatrixEvent) {
        const client = MatrixClientPeg.get();

        const isOwn = client.getUserId() === event.getSender();
        if (!isOwn) {
            const actions = client.getPushActionsForEvent(event, true);

            const color = !!actions.tweaks.highlight
                ? NotificationColor.Red
                : NotificationColor.Grey;

            this.updateNotificationState(color);
        }
    }

    private resetThreadNotification = (): void => {
        this.updateNotificationState(NotificationColor.None);
    };

    private updateNotificationState(color: NotificationColor) {
        const snapshot = this.snapshot();

        this._color = color;

        // finally, publish an update if needed
        this.emitIfUpdated(snapshot);
    }
}
