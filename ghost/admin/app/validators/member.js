import BaseValidator from './base';
import validator from 'validator';
import {isBlank} from '@ember/utils';

export default BaseValidator.create({
    // 관리자 비밀번호 등록 수정 시작
    // properties: ['name', 'email', 'note'],
    properties: ['name', 'email', 'password', 'note'],
    // 관리자 비밀번호 등록 수정 종료

    name(model) {
        if (!validator.isLength(model.name || '', 0, 191)) {
            model.errors.add('name', 'Name cannot be longer than 191 characters.');
            this.invalidate();
        }
    },

    email(model) {
        let email = model.email;

        if (isBlank(email)) {
            model.errors.add('email', 'Please enter an email.');
            this.invalidate();
        } else if (!validator.isEmail(email)) {
            model.errors.add('email', 'Invalid Email.');
            this.invalidate();
        }
        if (!validator.isLength(model.email || '', 0, 191)) {
            model.errors.add('email', 'Email cannot be longer than 191 characters.');
            this.invalidate();
        }

        model.hasValidated.addObject('email');
    },

    // 관리자 비밀번호 등록 수정 시작
    password(model) {
        let password = model.password;

        if (isBlank(password)) {
            model.errors.add('password', 'Please enter an password.');
            this.invalidate();
        }

        if (validator.isLength(model.password || '', 0, 9)) {
            model.errors.add('password', 'Password cannot be shoter than 10 characters.');
            this.invalidate();
        } else if (!validator.isLength(model.password || '', 10, 20)) {
            model.errors.add('password', 'Password cannot be longer than 20 characters.');
            this.invalidate();
        }

        model.hasValidated.addObject('password');
    },
    // 관리자 비밀번호 등록 수정 종료

    note(model) {
        let note = model.note;

        if (!validator.isLength(note || '', 0, 500)) {
            model.errors.add('note', 'Note is too long.');
            this.invalidate();
        }

        model.hasValidated.addObject('note');
    }
});
